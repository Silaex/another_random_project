/**
 *  author of this mess: @Silaex (github.com/silaex) :-)
 *  goal: none
 */

const ERROR_MSG = {
    Function: (function_name, err_message) => {
        console.error(`[${function_name}] ${err_message} [don't forget to check error's stack below for more information]`);
    },
}

const available_types = ["String", "Number", "Array", "Object"];

function type_of(data, type) {
    switch (type) {
        case "String":
            return typeof data === "string";
        case "Number":
            return typeof data === "number";
        case "Array":
            return Array.isArray(data);
        case "Object":
            return typeof data === "object" && !Array.isArray(data);
        default:
            return false; break;
    }
}

function instance_of(data, instance) {
    return data instanceof instance;
}

// It works only with available_types. It does not work with instances
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
    return null;
}

function function_builder(return_type, parameters_type, callback) {
    function is_a_regular_type(type, error_message = false) {
        const is_it = available_types.findIndex(t => type === t) !== -1;
        // more useless stuff??? yeah!!! idk...
        if (error_message && !is_it) {
            ERROR_MSG.Function(`function_builder::${is_a_regular_type.name}()`, `Be careful! You mispelled a type. Maybe you wanted to type one of those types [given: ${type}][available: ${available_types}]`);
        }

        return is_it;
    }

    return function callback_exe(...args) {
        // First we have to check if there is even or more
        // parameters_type than arguments used in callback
        if (args.length > parameters_type.length) {
            ERROR_MSG.Function(`function_builder::${callback_exe.name}`, "Numbers of arguments used in the callback function are greater than parameters types given");
        }
        // Then we need to check if there is as many arguments given
        // in the callback call than used in the callback setup
        if (args.length != callback.length) {
            ERROR_MSG.Function(`function_builder::${callback_exe.name}`, "Numbers of given values not matching callback arguments numbers");
        }

        // parameters_type checking
        {
            const param_types = parameters_type;
            // letting the option to put only ONE parameter type without puttin an array
            if (!type_of(parameters_type, "Array")) {
                param_types = Array(param_types);
            }

            for (let index = 0; index < param_types.length; index++) {
                const type_or_instance = param_types[index];

                if (type_of(type_or_instance, "String")) {
                    // Type checking
                    // Here just to warn about the mispelling if there is one
                    is_a_regular_type(type_or_instance, true);

                    if (!type_of(args[index], type_or_instance)) {
                        ERROR_MSG.Function(
                            callback.name ? `function_builder::parameter_type::${callback.name}` : "function_builder::parameter_type::callback()",
                            `callback parameter not matching with Type needed [given: ${get_type(args[index])}, wanted: ${type_or_instance}]`
                        );
                    }
                } else {
                    // Instance matching
                    if (!(args[index] instanceof type_or_instance)) {
                        ERROR_MSG.Function(
                            callback.name ? `function_builder::parameter_type::${callback.name}` : "function_builder::parameter_type::callback()",
                            `callback parameter not matching with Instance needed [given: ${args[index]}, wanted: ${type_or_instance.name}]`
                        );
                    }
                }
            }
        }

        // return_type checking
        {
            const cb_value = callback.apply(null, args);

            if (type_of(return_type, "String")) {
                // This is a regular type
                if (is_a_regular_type(return_type, true)) {
                    if (!type_of(cb_value, return_type)) {
                        ERROR_MSG.Function(callback.name ? `function_builder::parameter_type::${callback.name}` : "function_builder::return_type::callback()", "Callback doesn't return the type wanted.");
                    }
                }
            } else {
                if (!(cb_value instanceof return_type)) {
                    ERROR_MSG.Function(callback.name ? `function_builder::parameter_type::${callback.name}` : "function_builder::return_type::callback()", "Callback doesn't return the instance wanted.");
                }
            }
        }
    }
};

function_builder("String", ["Array"], function(age) {
    return "Hi!";
})([5]);
