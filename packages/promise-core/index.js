/**
 * 一个简单的符合Promise A+规范的实现
 */

 function CorePromise(handler) {
    // 三种状态pending, rejected, fulfilled
    this.status = 'pending';
    this.value = null;
    this.err = null;
    this.resolveCbs = [];
    this.rejectCbs = [];

    const resolve = (value) => {
        if (this.status === 'pending') {
            setTimeout(() => {
                this.status = 'fulfilled';
                this.value = value;
                this.resolveCbs.forEach(cb => cb(this.value));
            })
        }
    }

    const reject = (err) => {
        if (this.status === 'pending') {
            setTimeout(() => {
                this.status = 'rejected';
                this.err = err;
                this.rejectCbs.forEach(cb => cb(this.err));
            })
        }
    }

    try {
        handler(resolve, reject);
    } catch(err) {
        reject(err)
    }
 }

CorePromise.prototype.then = function (onFulfilled, onRejected) {
    let promise = null;
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (value) => value;
    onRejected = typeof onRejected === 'function' ? onRejected : (err) => { throw err };

    const handlePromise = (modifier, resolve, reject) => value => {
        try {
            const x = modifier(value);

            if (x === promise) {
                // 相同对象会循环调用，直接报错
                reject(new TypeError('Chaining cycle detected for promise!'))
                return;
            }

            // x是thenable
            if (x && typeof x.then === 'function') {
                x.then(resolve, reject);
            } else {
                // x不是thenable
                resolve(x);
            }
        } catch(err) {
            reject(err);
        }
    }

    promise = new CorePromise((resolve, reject) => {
        if (this.status === 'fulfilled') {
            handlePromise(onFulfilled, resolve, reject)(this.value);
        } else if (this.status === 'rejected') {
            handlePromise(onRejected, resolve, reject)(this.err);
        } else {
            this.resolveCbs.push(handlePromise(onFulfilled, resolve, reject));
            this.rejectCbs.push(handlePromise(onRejected, resolve, reject));
        }
    });
    
    return promise
}

CorePromise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected)
}

CorePromise.resolve = (value) => {
    return new CorePromise((resolve) => {
        resolve(value)
    })
}
CorePromise.reject = (error) => {
    return new CorePromise((resolve, reject) => {
        reject(error)
    })
}
CorePromise.all = (promises) => {
    const result = []
    const length = promises.length;
    let total = 0;
    return new CorePromise((resolve, reject) => {
        for (let i = 0; i < length; i++) {
            const promise = promises[i];
            promise.then(res => {
                result[i] = res;
                total++;

                if (total === length) {
                    resolve(result);
                }
            }, (err) => {
                reject(err);
            })
        }
    })
}
CorePromise.race = (promises) => {
    let isHandled = false
    return new CorePromise((resolve, reject) => {
        for (let i = 0; i < promises.length; i++) {
            promises[i].then((res) => {
                if (!isHandled) {
                    isHandled = true;
                    resolve(res)
                }
            }, reject)
        }
    })
}

module.exports.CorePromise = CorePromise