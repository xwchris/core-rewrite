# 实现Promise核心来更轻松的使用它
这是该代码实现系列的第一期 - Promise核心实现，更多问题欢迎多多在[Promise核心实现讨论区](https://github.com/xwchris/core-rewrite/issues/1)进行讨论

## 前提准备
这一次我们是要实现简单的`Promise`，帮助我们进行更加深入的了解`Promise`。
前提需要你理解什么是`Promise`以及`Promise`常用的用法，如果你不了解`Promise`可以点击[这里](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Using_promises)进行了解

## 写前思考
在实现之前我们要先思考下实现Promise包括哪些点，比如
- Promise是一个异步结果
- Promise有三种状态，状态只能从`pending`到`fulfilled`或者`pending`到`rejected`
- Promise可以链式调用
到这里想到这三个点，我们就可以开始动手实现了，让我们一步步来看

## 代码实现
### 构造函数实现
首先，我们来定义一个函数，为了不跟原有的`Promise`冲突我们命名为`CorePromise`
```js
function CorePromise(handler) {
    // write code here
 }
```
首先我们定义Promise的状态，Promsie初始状态是`pending`。同时我们知道Promise构造函数接受一个参数，该参数是一个函数，它会接受`resolve`和`reject`两个参数，方便我们进行调用，按这种逻辑我们实现成下面的样子
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

当调用`resolve`或`reject`的时候会发生什么那？promise的状态会变化，我们在我们之前的基础上实现`resolve`和`reject`函数，他们只会在`pending`状态会执行，同时由于是异步我们这里使用`setTimeout`进行包裹。调用后我们记录成功后的值或者失败的原因。
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

调用`resolve`或`reject`后除了状态变化，我们还会继续执行到then，并调用`then`里面定义的回调函数，将结果或失败原因传递给回调函数。我们定义两个数组来挂载回调函数，并在执行的时候遍历执行它们。

这里另外给` handler(resolve, reject)`执行进行了错误处理，当其直接报错的时候我们将`Promise`直接`reject`掉。
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

到这里我们构造函数实现就差不多了，下面来看`then`的实现。

### then实现

`then`的主要目标是挂载函数，当`Promise`状态变化的时候，能够执行这些函数，并且由于支持链式调用，所以then本身也返回一个`Promise`。`then`接受两个参数，第一个来处理`Promise`成功后的结果，第二个用来处理`Promise`失败后的结果，实现上当这两个函数不存在的时候我们赋予其默认值，直接将结果向下传递。
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
现在到了最重要的部分，实现`then`逻辑。
- 如果`Promise`已经是终态了，则直接进行将`then`返回的`Promse`也转变为终态。
- 如果当前`Promise`还处在`pending`状态，那么我们就将处理函数保存在`Promise`的回调数组中，以供进入终态后调用。
重要：这里涉及到两个`Promise`实例注意区分，分别是当前`Promise`和`then`中返回的新`Promise`，返回的新`Promise`在`Promise`状态变化后也进行变化
基本到这里我们核心就实现完毕了，考虑各种情况我们需要处理下
1. then的回调函数结果又是一个`Promise`实例（这与之前的提到的两种`Promise`都不同，属于第三个，这里稍微有点绕，需要好好思考清楚）
2. then的回调函数结果的`Promise`与当前then返回的`Promise`实例是同一个会造成循环调用，需要抛出错误

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

处理完特殊情况，我们最后再实现先`catch`函数，它可以获取到`Promise`调用链中的错误，实现起来也很简单，其实就是`then`的一个语法糖
```js
CorePromise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected)
}
```

### Promise常用函数实现
我们平时还会常用到的`Promise.resolve`、`Promise.reject`、`Promise.all`和`Promise.race`都来实现下。前两者都只不过是一个语法糖
#### Promise.resolve
`Promise.resolve`实现，返回一个立即进入`resolve`状态的`Promise`
```js
CorePromise.resolve = (value) => {
    return new CorePromise((resolve) => {
        resolve(value)
    })
}
```
#### Promise.reject
`Promise.reject`实现，返回一个立即进入`reject`状态的`Promise`
```js
CorePromise.reject = (error) => {
    return new CorePromise((resolve, reject) => {
        reject(error)
    })
}
```
#### Promise.all
`Promise.all`实现起来也不难，又两点需要注意
1. 当一个`Promise`进入`reject`，则整个结果`Promise`进入`reject`状态
2. 当所有`Promise`完成返回结果的时候，注意结果数组的返回顺序，这就是代码里没有直接把结果`push`进数组而是使用`result[i] = res`这种方式并配合`total`计数来实现
```js
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
```
#### Promise.race
`Promise.race`实现，哪个`Promise`先执行则直接忽略掉其他`Promise`
```js
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
```

## 结尾
