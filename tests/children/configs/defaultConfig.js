module.exports = function ({ dpp, http200, http999 }, { tests, test, assert }) {
    tests('defaultConfig', () => {
        test('defaultConfig.baseURL', () => {
            const pp = dpp(http200({
                response (resp) {
                    assert.isBe(resp.config.baseURL, 'http://127.0.0.1:4444/')
                },
            }))

            return pp.apis.test()
        })

        test('defaultConfig.timeout', () => {
            const pp = dpp(http999())
            return pp.apis.test().catch(error => {
                assert.isBe(error.message, 'timeout of 5000ms exceeded')
            })
        }, 10000)

        test('defaultConfig.withCredentials', () => {
            const pp = dpp(http200({
                response ({ config }) {
                    assert.isBe(config.withCredentials, false)
                },
            }))
            return pp.apis.test()
        })

        test('defaultConfig.responseType', () => {
            const pp = dpp(http200({
                response ({ config }) {
                    assert.isBe(config.responseType, 'json')
                },
            }))
            return pp.apis.test()
        })

        test('defaultConfig.headers', () => {
            const pp = dpp(http200({
                response ({ config }) {
                    assert.isBe(config.headers['Content-Type'], 'application/json')
                },
            }))
            return pp.apis.test()
        })
    })
}
