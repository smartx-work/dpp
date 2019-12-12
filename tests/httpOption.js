module.exports = {
    http200: createHttp(200),
    http404: createHttp(404),
    http999: createHttp(999),
    http000: createHttp(0),
}

function createHttp (code) {
    return function (globalConfig = {}) {
        return {
            ...globalConfig,
            apis: { test: { url: `?cmd=http${code}`, ...globalConfig.config } },
        }
    }
}
