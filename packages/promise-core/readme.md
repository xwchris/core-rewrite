# Promise-core
首先我们定义一个函数
```js
function CorePromise(handler) {
    // write code here
 }
```
```js
 function CorePromise(handler) {
    // 三种状态pending, rejected, fulfilled
    this.status = 'pending';

    function resolve() {

    }

    function reject() {

    }

    handler(resolve, reject);
 }
```

```js
 function CorePromise(handler) {
    // 三种状态pending, rejected, fulfilled
    this.status = 'pending';
    this.value = null;
    this.err = null;

   const resolve = (value) => {
        if (this.status === 'pending') {
            setTimeout(() => {
                this.status = 'fulfilled';
                this.value = value;
            })
        }
    }

    const reject = (err) => {
        if (this.status === 'pending') {
            setTimeout(() => {
                this.status = 'rejected';
                this.err = err;
            })
        }
    }

    handler(resolve, reject);
 }
```

```js
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
```
```js
CorePromise.prototype.then = function(resolveCb, rejectCb) {
    let promise = null;
    resolveCb = typeof resolveCb === 'function' ? resolveCb : (value) => value;
    rejectCb = typeof rejectCb === 'function' ? rejectCb : (err) => { throw err };

    promise = new CorePromise((resolve, reject) => {

    });
    
    return promise
}
```

```js
CorePromise.prototype.then = function (onFulfilled, onRejected) {CorePromise.prototype.then = function (onFulfilled, onRejected) {
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
```