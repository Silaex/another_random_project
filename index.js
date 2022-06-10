/**
 *  author of this mess: @Silaex (github.com/silaex) :-)
 *  goal: none
 */

const ERROR_MSG = {
    Function: (function_name, err_message) => {
        return Error(`[function::${function_name}] ${err_message}`);
    }
}

const available_types = [String, Number, Array, Object, Function];

function type_of(data, type) {
    switch (type) {
        case String:
            return typeof data === "string";
        case Number:
            return typeof data === "number";
        case Array:
            return Array.isArray(data);
        case Object:
            return typeof data === "object" && !Array.isArray(data);
        case Function:
            return data instanceof Function;
        default:
            throw ERROR_MSG.Function(type_of.name, `wrong type given:${type}. maybe you wanted one of those [${available_types}]`);
    }
}

function instance_of(data, instance) {
    return data instanceof instance;
}

function get_type(data) {
    for (let i = 0; i < available_types.length; i++) {
        const type = available_types[i];
        if (type_of(data, type)) {
            if (type.name) {
                return type.name;
            } else {
                return type;
            }
        }
    }
}
