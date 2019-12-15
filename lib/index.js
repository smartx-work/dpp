const axios = require('axios')

const { defaults, globals, shares } = require('./defaultConfig')
const acceptConfigKeys = Object.keys(shares.axios).concat(Object.keys(shares.dpp))

proxy.defaults = defaults
module.exports = proxy

function proxy (globalConfig) {
    return new DPP(globalConfig)
}

class DPP {
    constructor (globalConfig) {
        const {
            // 是否开发环境
            env = 'development',
            logInfo = false,

            // 拦截器钩子
            request,
            response,
            success,
            failure,

            // axios配置项
            baseURL = defaults.baseURL,
            timeout = defaults.timeout,
            withCredentials = defaults.withCredentials,
            responseType = defaults.responseType,

            // 自定义配置项
            customConfigs = {},

            // 接口配置项
            apis = {},
        } = globalConfig

        this._envIsDevelopment = env === 'development'
        this._logInfo = logInfo
        this._handles = { request, response, success, failure }
        this._axios = axios.create(Object.assign({}, globals.axios, {
            baseURL, timeout, withCredentials, responseType,
        }))
        this._customConfigs = this._createCustomConfigs(customConfigs)
        this.apis = this._createAPI(apis)
    }

    _createCustomConfigs (originCoustomConfigs) {
        if (this._envIsDevelopment) {
            // 开发模式下对配置项进行校验
        }

        return originCoustomConfigs

        /*
        四种模式的自定义配置项定义
        const customConfigs = {
            a: true, // 配置项是任意类型
            b: [ Boolean, String ], // 配置项必须是数组中的类型
            c: { // 配置项有类型和默认值
                type: String,
                default: 'xxx',
            },
            d: function (value, valueType, sourceType) { // 配置项通过拦截器返回
                return value
            }, sourceType === 'share, private'
        }
        */
    }

    _createAPI (apis) {
        const allConfigs = {}
        const groupConfigsUnique = {}
        const pushConfig = (apiName, apiConfig, groupName) => {
            // 对配置项做重复，完整性校验
            if (this._envIsDevelopment) {
                if (apiName in groupConfigsUnique) {
                    groupName = groupConfigsUnique[apiName]
                    return console.error(`注册服务${groupName}.${apiName}失败，存在同名服务${groupName}.${apiName}`)
                }

                if (apiName in allConfigs) {
                    return console.error(`注册服务${groupName}.${apiName}失败，存在同名服务${apiName}`)
                }

                // 配置项做字段校验
                if (apiConfig.mock && typeof apiConfig.mock !== 'function') {
                    return console.error(`注册服务${groupName}.${apiName}失败，mock配置项必须为Function`)
                }
            }

            allConfigs[apiName] = apiConfig
            if (groupName) {
                groupConfigsUnique[apiName] = groupName
            }
        }

        Object.keys(apis).forEach(key => {
            const value = apis[key]
            if (!value || typeof value !== 'object') {
                return
            }

            if (typeof value.url === 'string') {
                return pushConfig(key, value)
            }
            const group = value
            Object.keys(group).forEach(key2 => {
                const value = group[key2]
                if (!value || typeof value !== 'object') {
                    return
                }

                if (typeof value.url === 'string') {
                    return pushConfig(key2, value, key)
                } else {
                    throw Error(`配置项必须包含url：${key}.${key2}`)
                }
            })
        })

        return new Proxy({}, {
            get: (apis, key) => {
                if (!allConfigs[key]) {
                    return
                }

                return (...args) => this._request(allConfigs[key], ...args)
            },
        })
    }

    _request (shareConfig, sendData, callback, privateConfig) {
        // sendData, callback
        // sendData, callback, privateConfig
        // sendData, privateConfig
        // sendData

        // 由参数callback是否传入决定是callback模式还是Promise模式

        // 无sendData参数
        if (typeof sendData === 'function') {
            privateConfig = callback
            callback = sendData
            sendData = null
        }

        // 不传callback，那么属于Promise模式
        if (typeof callback !== 'function') {
            privateConfig = callback
            callback = null
        }

        sendData = sendData || {}
        callback = callback || null
        privateConfig = privateConfig || {}

        const data = sendData // 发生的数据，根据methods的方式设置到不同的地方
        const config = this._createConfig(shareConfig, privateConfig) // 当前请求实例的配置项
        let requestOption = { data, config }
        config.data = data

        // 请求拦截器中进行处理
        if (this._handles.request) {
            requestOption = this._getNewValue(requestOption, this._handles.request(data, config))
            config.data = requestOption.data
        }

        this._convertRESTful(config)

        const asyncResult = (config.mock || config.mockData) ? this._mockResponse(requestOption) : this._httpResponse(requestOption)

        if (!callback) {
            return asyncResult
        }

        asyncResult
            .then((responseData) => {
                callback(responseData, null)
            })
            .catch((error) => {
                callback(null, error)
            })
    }

    _createConfig (shareConfig, privateConfig) {
        const config = {}
        // 加入axios默认配置项
        for (const key in shares.axios) {
            if (shares.axios[key] != null) {
                config[key] = shares.axios[key]
            }
        }
        // 加入ipp默认配置项
        for (const key in shares.dpp) {
            if (shares.dpp[key] != null) {
                config[key] = shares.dpp[key]
            }
        }
        // 加入共享配置项
        for (const key in shareConfig) {
            if (acceptConfigKeys.includes(key)) {
                config[key] = shareConfig[key]
            } else {
                this._tryAddCustomConfig(config, key, shareConfig[key], 'share')
            }
        }

        // 加入私有配置项
        for (const key in privateConfig) {
            if (acceptConfigKeys.includes(key)) {
                config[key] = privateConfig[key]
            } else {
                this._tryAddCustomConfig(config, key, privateConfig[key], 'private')
            }
        }

        // 非开发模式下关闭mock
        if (!this._envIsDevelopment) {
            delete config.mock
            delete config.mockData
        }

        return config
    }

    _mockResponse (requestOption) {
        const { config, data } = requestOption
        try {
            let asyncResponseObject
            if (config.mock) {
                const responseObject = config.mock({ data, headers: config.headers })
                asyncResponseObject = isPromise(responseObject)
                    ? responseObject // isPromise
                    : new Promise((resolve, reject) => {
                        resolve(responseObject)
                    })
            } else {
                // mockData
                const responseData = config.mockData({ data, headers: config.headers })
                asyncResponseObject = new Promise(resolve => {
                    if (isPromise(responseData)) {
                        responseData.then((data) => {
                            resolve({ data, headers: {} })
                        })
                    } else {
                        resolve({ data: responseData, headers: {} })
                    }
                })
            }
            return this._onResponse(asyncResponseObject, config)
        } catch (error) {
            return new Promise((resolve, reject) => {
                reject(error)
            })
        }


        function isPromise (data) {
            return typeof data === 'object' && typeof data.then === 'function'
        }
    }

    _httpResponse (requestOption) {
        const { config, data } = requestOption
        const axiosConfig = Object
            .keys(config)
            .filter(key => key in shares.axios)
            .reduce((axiosConfig, key) => (axiosConfig[key] = config[key], axiosConfig), {})

        if (config.method === 'get') {
            axiosConfig.params = data
        } else {
            axiosConfig.data = data
        }

        return this._onResponse(this._axios(axiosConfig), config)
    }

    _onResponse (asyncResponseObject, config) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                asyncResponseObject
                    .then(responseObject => {
                        if (this._handles.response) {
                            responseObject = this._getNewValue(responseObject, this._handles.response(responseObject, config))
                        }
                        if (this._handles.success) {
                            responseObject.data = this._getNewValue(responseObject.data, this._handles.success(responseObject.data, config))
                        }

                        if (this._envIsDevelopment && this._logInfo) {
                            console.warn('=== dpp.response ===\n', { responseObject, config })
                        }
                        resolve(responseObject.data)
                    })
                    .catch(error => {
                        if (this._handles.failure) {
                            error = this._getNewValue(error, this._handles.failure(error, config))
                        }

                        if (this._envIsDevelopment && this._logInfo) {
                            console.warn('=== dpp.error ===\n', { error, config })
                        }
                        reject(error)
                    })
            }, config.delay || 0)
        })
    }

    _getNewValue (oldValue, newValue) {
        return newValue !== undefined ? newValue : oldValue
    }

    _tryAddCustomConfig (config, key, value, sourceType) {
        const customConfigs = this._customConfigs
        const valueType = typeof value
        const option = customConfigs[key]

        if (!option) {
            return
        }

        // 配置项为true，则无脑插入配置项
        if (option === true) {
            return config[key] = value
        }

        // 配置项为数组，则判断类型是否符合，符合则插入
        if (Array.isArray(option)) {
            const types = option
            if (value != null && types.includes(value.constructor)) {
                config[key] = value
            }
            return
        }

        // 配置项为一个option，则使用内置的项分别处理
        if (typeof option === 'object') {
            const { types, defaultValue } = option

            // 类型判断
            if (types) {
                if (!value || types.includes(value.constructor)) {
                    return
                }
            }

            if (value != null) {
                config[key] = value
                return
            }

            if (defaultValue != null) {
                config[key] = defaultValue
            }
            return
        }

        // 函数拦截器
        if (typeof option === 'function') {
            const newValue = option(value, valueType, sourceType)
            if (newValue != null) {
                config[key] = newValue
            }
        }
    }

    _convertRESTful (config) {
        const { url, data } = config
        if (!/\{\w+\}/.test(url)) {
            return
        }
        config.url = url.replace(/\{(\w+)\}/g, (match, key) => {
            if (key in data) {
                return data[key]
            }
            return match
        })
    }
}
