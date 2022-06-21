/**
 *  author of this mess: @Silaex (github.com/silaex) :-)
 *  goal: none
 */

const ERROR_MSG = {
    Function: (function_name, err_message) => {
        console.error(`[${function_name}] ${err_message} [don't forget to check error's stack below for more information]`);
    },
}

const available_types = ["String", "Number", "Array", "Object", "Any"];

function type_of(data, type) {
    switch (type) {
        case "Any":
            return true;
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

    // Do we return the value or not ??? In case an error is detected
    let do_return_value = true;
    const set_return_value_false = () => { do_return_value = false; }

    if (return_type === null || return_type === undefined) {
        set_return_value_false();
        ERROR_MSG.Function(`function_builder::return_type`, "The return type should not be empty.");
    }

    if (parameters_type === null || parameters_type === undefined) {
        set_return_value_false();
        ERROR_MSG.Function(`function_builder::parameter_type`, "The parameter types should not be empty.");
    }

    if (callback === null || callback === undefined) {
        set_return_value_false();
        ERROR_MSG.Function(`function_builder::callback`, "The callback type should not be empty.");
    }
    if (!instance_of(callback, Function)) {
        set_return_value_false();
        ERROR_MSG.Function(`function_builder::callback`, "The callback should be a Function.");
    }

    return function callback_exe(...args) {
        if (args.length != callback.length) {
            set_return_value_false();
            ERROR_MSG.Function(`function_builder::${callback_exe.name}`, "Numbers of given values not matching callback arguments numbers");
        }

        // return_type checking
        {
            const cb_value = callback.apply(null, args);

            if (type_of(return_type, "String")) {
                // This is a regular type
                if (is_a_regular_type(return_type, true)) {
                    if (!type_of(cb_value, return_type)) {
                        set_return_value_false();
                        ERROR_MSG.Function(callback.name ? `function_builder::return_type::${callback.name}` : "function_builder::return_type::callback()", "Callback doesn't return the type wanted.");
                    }
                }
            } else {
                try {
                    if (!instance_of(cb_value, return_type)) {
                        set_return_value_false();
                        ERROR_MSG.Function(callback.name ? `function_builder::return_type::${callback.name}` : "function_builder::return_type::callback()", "Callback doesn't return the instance wanted.");
                    }
                } catch(e) {
                    set_return_value_false();
                    ERROR_MSG.Function(callback.name ? `function_builder::return_type::${callback.name}` : "function_builder::return_type::callback()", "Wrong syntax.");
                }
            }
        }

        // parameters_type checking
        {
            // letting the option to put only ONE parameter type without puttin an array
            let param_types = parameters_type;

            if (!type_of(parameters_type, "Array")) {
                param_types = Array(param_types);
            }

            if (args.length != param_types.length) {
                set_return_value_false();
                ERROR_MSG.Function(`function_builder::${callback_exe.name}`, "Numbers of arguments used in the callback function call are different than parameters types given");
            }

            for (let index = 0; index < param_types.length; index++) {
                const type_or_instance = param_types[index];

                if (type_of(type_or_instance, "String")) {
                    // Type checking
                    // Here just to warn about the mispelling if there is one
                    is_a_regular_type(type_or_instance, true);

                    if (!type_of(args[index], type_or_instance)) {
                        set_return_value_false();
                        ERROR_MSG.Function(
                            callback.name ? `function_builder::parameter_type::${callback.name}` : "function_builder::parameter_type::callback()",
                            `callback parameter not matching with Type needed [given: ${get_type(args[index])}, wanted: ${type_or_instance}]`
                        );
                    }
                    // Instance matching
                } else {
                    try {
                        if (!instance_of(args[index], type_or_instance)) {
                            set_return_value_false();
                            ERROR_MSG.Function(
                                callback.name ? `function_builder::parameter_type::${callback.name}` : "function_builder::parameter_type::callback()",
                                `callback parameter not matching with Instance needed [given: ${args[index]}, wanted: ${type_or_instance.name}]`
                            );
                        }
                    } catch (e) {
                        set_return_value_false();
                        ERROR_MSG.Function(
                            callback.name ? `function_builder::parameter_type::${callback.name}` : "function_builder::parameter_type::callback()",
                            `Wrong syntax`
                        );
                    }
                }
            }
        }

        // Atfer all those verifications we can gladly send the return value!
        if (do_return_value) {
            return callback.apply(null, args);
        }
    }
};

const fnc = function_builder("String", "Any", function fnc(value) {
    return String(value);
});

console.log(fnc(5));
