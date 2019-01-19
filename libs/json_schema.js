module.exports = function (body, schema) {
    let errors = []
    const types = {
        required: {
            message: '此字段为必填'
        },
        string: {
            name: String,

            message: '此字段应为字符串类型'
        },
        number: {
            name: Number,

            message: '此字段应为数字类型'
        }
    }
    for (let k in schema) {
        console.log(22)
        if (schema[k]['type'] == 'required') {
            if (!body[k]) {
                errors.push({
                    fields: k,
                    errorMessage: types[schema[k]['type']].message
                })
            }
        } else {
            console.log(types[schema[k]['type']])
            if (!(body[k] instanceof types[schema[k]['type']].name)) {
                errors.push({
                    fields: k,
                    errorMessage: types[schema[k]['type']].message
                })
            }
        }
        if (schema[k]['reg']) {
            if (!schema[k]['reg'].test(body[k])) {
                errors.push({
                    fields: k,
                    errorMessage: schema[k].message
                })
            }
        }
    }
    if (errors.length != 0) {
        return errors
    } else {
        return 0
    }
}