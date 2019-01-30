module.exports = function (body, schema) {
    //错误结果数组
    let errors = []
    //现已支持的类型
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
    //验证类型
    for (let k in schema) {
        if (schema[k]['type'] == 'required') {
            if (body[k] === '') {
                errors.push({
                    fields: k,
                    errorMessage: types[schema[k]['type']].message
                })
            }
        } else {
            if (!(body[k] instanceof types[schema[k]['type']].name)) {
                errors.push({
                    fields: k,
                    errorMessage: types[schema[k]['type']].message
                })
            }
        }
        //验证正则
        if (schema[k]['reg']) {
            if (!schema[k]['reg'].test(body[k])) {
                errors.push({
                    fields: k,
                    errorMessage: schema[k].message
                })
            }
        }
        //支持expression
        if (schema[k]['exp']) {
            if (!eval(schema[k]['exp'])) {
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