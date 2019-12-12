module.exports = function ({ dpp, http200, http999 }, { tests, test, assert }) {
    tests('handles', () => {
        test('handles.request(data, config)', () => {
            const sendData = { id: 'GX-001' }
            const privateConfig = { method: 'post' }
            const p1 = dpp(http200({
                request (data, config) {
                    assert.isEqual(data, sendData)
                    assert.isBe(config.method, privateConfig.method)

                    data.id = 'GX-002'
                    config.method = 'get'
                },
                response (resp, config) {
                    assert.isBe(resp.config.method, 'get')
                    assert.isBe(resp.config.params.id, 'GX-002')
                    assert.isBe(config.method, 'get')
                },
            }))
            const p2 = dpp(http200({
                request (data, config) {
                    return {
                        data: { id: 'GX-002' },
                        config: {
                            ...config,
                            method: 'get',
                            timeout: 12345,
                        },
                    }
                },
                response ({ config }) {
                    assert.isBe(config.method, 'get')
                    assert.isBe(config.params.id, 'GX-002')
                    assert.isBe(config.timeout, 12345)
                },
            }))

            return Promise.all([
                p1.apis.test(sendData, privateConfig),
                p2.apis.test(sendData, privateConfig),
            ])
        })

        test('handles.response(resp, config)', () => {
            const pp = dpp(http200({
                response (resp, config) {
                    assert.isObject(resp)
                    assert.isObject(resp.config)
                    assert.isObject(config)
                    assert.isString(config.method)

                    resp.data = { a: 1 }
                },
                success (data) {
                    assert.isEqual(data, { a: 1 })
                },
            }))

            return pp.apis.test()
        })

        test('handles.success(data, config)', () => {
            const pp = dpp(http200({
                success (data, config) {
                    assert.isObject(data)
                    assert.isBe(data.cmd, 'http200')
                    assert.isObject(config)
                    return { a: 1 }
                },
            }))

            return pp.apis.test().then((data) => {
                assert.isEqual(data, { a: 1 })
            })
        })

        test('handles.failure(error, config)', () => {
            const p1 = dpp(http200({
                response () {
                    throw Error('xxx')
                },
                failure (error, config) {
                    assert.isObject(error)
                    assert.isObject(config)
                    assert.isBe(error.message, 'xxx')
                    return new Error('xyz')
                },
            }))

            const p2 = dpp(http999({
                timeout: 123,
                failure (error, config) {
                    assert.isObject(error)
                    assert.isObject(config)
                },
            }))

            return Promise.all([
                p1.apis.test().catch(error => {
                    assert.isObject(error)
                    assert.isBe(error.message, 'xyz')
                }),
                p2.apis.test().catch(error => {
                    assert.isObject(error)
                    assert.isBe(error.message, 'timeout of 123ms exceeded')
                }),
            ])
        })
    })
}
