module.exports = function ({ dpp, http200, adapter, object }, { tests, test, assert }) {
    tests('example', () => {
        test('example.adapter', () => {
            const pp = dpp(http200({
                customConfigs: {
                    reqa (value, type) {
                        if (type === 'function') {
                            return value
                        }
                        if (type === 'object') {
                            return adapter(value).input
                        }

                        throw Error('reqa数据类型错误')
                    },
                    mockData (value, type) {
                        if (type === 'object') {
                            return () => value
                        }
                        if (type === 'function') {
                            return value
                        }
                    },
                },

                config: {
                    reqa: {
                        name: 'newName',
                        value: String,
                    },
                },

                request (data, config) {
                    // 请求适配器
                    if (config.reqa) {
                        object.emptyAssign(data, config.reqa(data))
                    }

                    // mock响应数据
                    if (config.mockData) {
                        config.mock = (...args) => {
                            return {
                                data: config.mockData(...args),
                            }
                        }
                    }
                },

                response (resp, config) {
                    assert.isEqual(config.data, { newName: '张三', value: '111' })
                },
            }))

            return pp.apis.test({ name: '张三', value: 111 }, {
                mockData: function ({ data, headers }) {
                    return {
                        name: data.newName,
                        age: data.value,
                        someElse: 'xxx',
                    }
                },
            }).then(data => {
                assert.isEqual(data, { name: '张三', age: '111', someElse: 'xxx' })
            })
        })

        test('example.errorCatch', () => {
            const pp = dpp(http200({
                response ({ data }) {
                    if (data.code !== 0) {
                        throw Error(data.message)
                    }
                },
                failure (error) {
                    assert.isBe(error.message, '请求异常')
                },
                config: {
                    mock () {
                        return {
                            data: {
                                code: 10,
                                message: '请求异常',
                            },
                        }
                    },
                },
            }))

            return pp.apis.test().catch(() => {})
        })

        test('example.normal', () => {
            const pp = dpp({
                apis: {
                    test: {
                        url: '?cmd=http200',
                        reqa: {
                            pageSize: Number,
                            page: Number,
                        },
                        resa: {
                            currentPage: 'page',
                            pageSize: true,
                            data: {
                                $key: 'list',
                                title: true,
                                img: true,
                                price: (value) => `￥${value.toFixed(2)}`,
                                skuList: {
                                    code: true,
                                    label: true,
                                },
                            },
                        },
                    },
                },
                baseURL: '',
                timeout: 2000,
                customConfigs: {
                    reqa (value, valueType) { // 请求参数适配器
                        if (valueType === 'function') {
                            return value
                        }
                        if (valueType === 'object') {
                            return adapter(value).input
                        }
                    },
                    resa (value, valueType) { // 响应数据适配器
                        if (valueType === 'function') {
                            return value
                        }
                        if (valueType === 'object') {
                            return adapter(value).input
                        }
                    },
                    preventDefaultError: true,
                    disabledCatch: true,
                },
                request (data, config) {
                    if (config.reqa) {
                        object.emptyAssign(data, config.reqa(data))
                    }
                },
                response (resp, config) {
                    const { data } = resp
                    const { code } = data

                    if (code === 1008) {
                        throw Error('NO-LOGIN')
                    }

                    if (code !== 0) {
                        throw Error(data.message)
                    }

                    // 业务数据是放在响应数据的data字段下的，这样处理让success直接使用业务数据
                    resp.data = resp.data.data
                },
                success (data, config) {
                    if (config.resa) {
                        object.emptyAssign(data, config.resa(data))
                    }
                },
                failure (error, config) {
                    if (config.preventDefaultError) {
                        return
                    }
                    if (error.message === 'NO-LOGIN') {
                        return console.error('登录失效')
                    }
                    console.error(error.message)
                },
            })


            const sendData = { page: '1', pageSize: '2' }
            return pp.apis.test(sendData, {
                mockData ({ data }) {
                    return {
                        code: 0,
                        data: {
                            currentPage: data.page,
                            pageSize: data.pageSize,
                            data: [
                                {
                                    title: '商品标题',
                                    img: 'http://xxxxx',
                                    price: 12.3,
                                    skuList: [
                                        { code: 'SKU-01', label: '红色-XXL', xxx: 111 },
                                        { code: 'SKU-02', label: '黑色-XXL', xxx: 222 },
                                    ],
                                },
                            ],
                        },
                    }
                },
            }).then(data => {
                assert.isEqual(data, {
                    page: 1,
                    pageSize: 2,
                    list: [
                        {
                            title: '商品标题',
                            img: 'http://xxxxx',
                            price: '￥12.30',
                            skuList: [
                                { code: 'SKU-01', label: '红色-XXL' },
                                { code: 'SKU-02', label: '黑色-XXL' },
                            ],
                        },
                    ],
                })
            }).catch(err => {
                console.error(err.message)
            })
        })
    })
}
