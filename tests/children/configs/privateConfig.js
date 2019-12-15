module.exports = function ({ dpp, http200, http999 }, { tests, test, assert }) {
    tests('privateConfig', () => {
        test('privateConfig.headers', () => {
            const pp = dpp(http200({
                config: {
                    headers: { a: 1, b: 2 },
                },
                response ({ config }) {
                    assert.isBe(config.headers.a, 11)
                    assert.isBe(config.headers.b, undefined)
                    assert.isBe(config.headers.c, 22)
                },
            }))

            return pp.apis.test(null, {
                headers: { a: 11, c: 22 },
            })
        })

        test('privateConfig.timeout', () => {
            const pp = dpp(http999({
                config: { timeout: 189 },
            }))
            return pp.apis.test(null, { timeout: 222 }).catch((error) => {
                assert.isBe(error.message, 'timeout of 222ms exceeded')
            })
        })

        test('privateConfig.delay', () => {
            const now = Date.now()
            const pp1 = dpp(http200({
                success () {
                    assert.isTrue(Date.now() - now < 100)
                },
            }))
            const pp2 = dpp(http200({
                config: { delay: 100 },
                success () {
                    assert.isTrue(Date.now() - now >= 1000)
                },
            }))
            return Promise.all([ pp1.apis.test(), pp2.apis.test(null, { delay: 1000 }) ])
        })

        test('privateConfig.mock', () => {
            const shareMock = {
                headers: { a: 1, b: 2 },
                data: 'this is mock',
            }
            const privateMock = {
                data: 'this is private mock',
            }
            const pp = dpp(http200({
                config: {
                    mock () {
                        return shareMock
                    },
                },
                response (resp) {
                    assert.isEqual(resp, { data: privateMock.data, headers: {}, config: {} })
                },
            }))

            return pp.apis.test(null, {
                mock () {
                    return privateMock
                },
            })
        })
    })
}
