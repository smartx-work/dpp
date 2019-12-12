module.exports = function ({ dpp, http200 }, { tests, test, assert }) {
    tests('RESTful', () => {
        test('RESTful.get', () => {
            const pp = dpp(http200({
                response ({ config }) {
                    assert.isBe(config.url, 'http://127.0.0.1:4444/goods/1001?cmd=http200')
                    assert.isEqual(config.params, {
                        id: 1001, type: 'goods',
                    })
                },
                config: {
                    url: '{type}/{id}?cmd=http200',
                },
            }))

            return pp.apis.test({ type: 'goods', id: 1001 })
        })
        test('RESTful.post', () => {
            const pp = dpp(http200({
                response ({ config }) {
                    assert.isBe(config.url, 'http://127.0.0.1:4444/goods/1001?cmd=http200')
                    assert.isBe(config.data, JSON.stringify({
                        type: 'goods', id: 1001,
                    }))
                },
                config: {
                    method: 'post',
                    url: '{type}/{id}?cmd=http200',
                },
            }))
            return pp.apis.test({ type: 'goods', id: 1001 })
        })
    })
}
