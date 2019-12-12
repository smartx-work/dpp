module.exports = function ({ dpp, http200, http999 }, { tests, test, assert }) {
    tests('apiArgs', () => {
        test('apiArgs(data)', () => {
            const data = { id: 'GX-001', type: 2 }
            const pp1 = dpp(http200({
                response ({ config }) {
                    assert.isEqual(config.params, data)
                },
            }))
            const pp2 = dpp(http200({
                config: {
                    method: 'post',
                },
                response ({ config }) {
                    assert.isEqual(config.data, JSON.stringify(data))
                },
            }))

            return Promise.all([ pp1.apis.test(data), pp2.apis.test(data) ])
        })

        test('apiArgs(data, config)', () => {
            const data = { id: 'GX-001', type: 2 }
            const pp = dpp(http200({
                response ({ config }) {
                    assert.isEqual(config.params, data)
                    assert.isBe(config.headers.a, 1)
                },
            }))

            return pp.apis.test(data, { headers: { a: 1 } })
        })

        test('apiArgs(data, callback)', () => {
            const sendData = { id: 'GX-001' }
            const pp = dpp(http200({
                response ({ config }) {
                    assert.isEqual(config.params, sendData)
                },
            }))
            return new Promise(resolve => {
                pp.apis.test(sendData, function (data, error) {
                    assert.isObject(data)
                    assert.isNull(error)
                    resolve()
                })
            })
        })

        test('apiArgs(data, callback, config)', () => {
            const data = { id: 'GX-001' }
            const pp = dpp(http200({
                response ({ config }) {
                    assert.isEqual(config.params, data)
                    assert.isBe(config.headers.a, 'abc')
                },
            }))
            return new Promise(resolve => {
                pp.apis.test(data, function (data, error) {
                    assert.isObject(data)
                    assert.isNull(error)
                    resolve()
                }, { headers: { a: 'abc' } })
            })
        })

        test('apiArgs(callback)', () => {
            const pp1 = dpp(http200())
            const pp2 = dpp(http999({
                timeout: 10,
            }))

            return Promise.all([
                new Promise(resolve => {
                    pp1.apis.test(function (data, error) {
                        assert.isObject(data)
                        assert.isNull(error)
                        resolve()
                    })
                }),
                new Promise(resolve => {
                    pp2.apis.test(function (data, error) {
                        assert.isNull(data)
                        assert.isObject(error)
                        resolve()
                    })
                }),
            ])
        })

        test('apiArgs(callback, config)', () => {
            const pp = dpp(http200({
                response ({ config }) {
                    assert.isBe(config.headers.a, 'io')
                },
            }))

            return new Promise(resolve => {
                pp.apis.test(function (data, error) {
                    assert.isObject(data)
                    assert.isNull(error)
                    resolve()
                }, { headers: { a: 'io' } })
            })
        })
    })
}
