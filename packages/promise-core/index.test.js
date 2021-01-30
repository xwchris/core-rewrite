const { expect, test } = require('@jest/globals');
const CorePromise = require('./index').CorePromise;

test('直接resolve Promise应该正确返回结果', () => {
    return new CorePromise((resolve) => {
        setTimeout(() => {
            resolve(5);
        })
    }).then(res => {
        expect(res).toBe(5);
    })
})
test('直接reject Promise应该正确返回结果', () => {
    return new CorePromise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error('error'))
        })
    }).then(null, (err) => {
        expect(err.message).toBe('error');
    })
})
test('then的结果又是一个Promise应该正确返回结果', () => {
    return new CorePromise((resolve, reject) => {
        setTimeout(() => {
            resolve(6)
        })
    }).then(res => new CorePromise((resolve) => {
        resolve(res + 6)
    })).then(res => {
        expect(res).toBe(12)
    })
})
test('Promise中抛出一个错在then中能接受到', () => {
    return new CorePromise(() => {
        throw new Error('error')
    }).then(null, (err) => {
        expect(err.message).toBe('error')
    })
})
test('catch能抓到错误结果', () => {
    return new CorePromise(() => {
        throw new Error('error')
    }).then().then().catch(err => expect(err.message) === 'error')
})
test('Promise.resolve会直接resolve一个值', () => {
    return expect(CorePromise.resolve(4)).resolves.toBe(4);
})
test('Promise.reject会直接reject一个值', () => {
    return expect(CorePromise.reject(4)).rejects.toBe(4);
})
test('Promise.all传入过个promise会按顺序返回值', () => {
    const promises = [
        new CorePromise(resolve => {
            setTimeout(() => {
                resolve(1)
            }, 200)
        }),
        new CorePromise(resolve => {
            resolve(2)
        }),
        new CorePromise(resolve => {
            setTimeout(() => {
                resolve(3)
            }, 100)
        })
    ]

    return Promise.all(promises).then(res => expect(res).toEqual([1, 2, 3]))
})
test('Promise.all其中一个reject会直接reject', () => {
    const promises = [
        new CorePromise(resolve => {
            setTimeout(() => {
                resolve(1)
            }, 200)
        }),
        new CorePromise((resolve, reject) => {
            reject(new Error('error'))
        }),
        new CorePromise(resolve => {
            setTimeout(() => {
                resolve(3)
            }, 100)
        })
    ]

    return Promise.all(promises).catch(err => expect(err.message).toBe('error'))
})
test('Promise.race中多个promise最快的resolve则全部resolve', () => {
    const promises = [
        new CorePromise((resolve) => {
            setTimeout(() => {
                resolve(1)
            }, 200)
        }),
        new CorePromise((resolve) => {
            setTimeout(() => {
                resolve(2)
            }, 100)
        })
    ]
    return CorePromise.race(promises).then(res => expect(res).toBe(2))
})