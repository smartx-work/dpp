module.exports = function ({ dpp, http200, http000, http999 }, { tests, test, assert }) {
    tests('shareConfig', () => {
        test('shareConfig.url', () => {
            const pp = dpp(http200({
                config: {
                    url: '?cmd=http200&seturl=1',
                },
                response ({ config }) {
                    assert.isMatch(config.url, /\?cmd=http200&seturl=1$/)
                },
            }))
            return pp.apis.test()
        })

        test('shareConfig.method', () => {
            const pps = [ 'get', 'post', 'put', 'delete', 'patch' ].map(method => {
                return dpp(http200({
                    config: { method },
                    response ({ config }) {
                        assert.isBe(config.method, method)
                    },
                }))
            })
            return Promise.all(pps)
        })

        test('shareConfig.headers', () => {
            const pp = dpp(http200({
                config: {
                    headers: { a: 1, b: 2 },
                },
                response ({ config }) {
                    assert.isBe(config.headers.a, 1)
                    assert.isBe(config.headers.b, 2)
                },
            }))

            return pp.apis.test(null)
        })

        test('shareConfig.timeout', () => {
            const pp = dpp(http999({
                config: { timeout: 189 },
            }))
            return pp.apis.test().then().catch((error) => {
                assert.isBe(error.message, 'timeout of 189ms exceeded')
            })
        })

        test('shareConfig.delay', () => {
            const now = Date.now()
            const pp1 = dpp(http200({
                success () {
                    assert.isTrue(Date.now() - now < 100)
                },
            }))
            const pp2 = dpp(http200({
                config: { delay: 2000 },
                success () {
                    assert.isTrue(Date.now() - now >= 2000)
                },
            }))
            return Promise.all([ pp1.apis.test(), pp2.apis.test() ])
        })

        test('shareConfig.mock', () => {
            const mock = {
                headers: { a: 1, b: 2 },
                data: 'this is mock',
            }
            const pp = dpp(http200({
                config: {
                    mock () {
                        return mock
                    },
                },
                response (resp, config) {
                    assert.isEqual(resp, mock)
                },
            }))

            return pp.apis.test()
        })

        test('shareConfig.mockData', () => {
            const mockData = { a: 123 }
            const pp = dpp(http200({
                response ({ data }) {
                    assert.isEqual(data, mockData)
                },
                config: {
                    mockData () {
                        return mockData
                    },
                },
            }))

            return pp.apis.test()
        })
    })
}
