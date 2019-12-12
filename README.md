# dpp
data pull push


### 示例
```js
const { object } = require('fly-utils')
const adapter = require('@smartx/adapter')
const dpp = require('dpp')
const request = dpp({
    apis: {
        // 接口配置项
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
            object.emptyAssgin(data, config.resa(data))
        }
    },
    failure (error, config) {
        if (config.preventDefaultError) {
            return
        }
        if (error.message === 'NO-LOGIN') {
            return alert('登录失效')
        }
        alert(error.message)
    },
})


```