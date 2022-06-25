/**
 *  author of this mess: @Silaex (github.com/silaex) :-)
 *  goal: none
 */

const ERROR_MSG = {
    Function: (function_name, err_message) => {
        console.error(`[${function_name}] ${err_message} [don't forget to check error's stack below for more information]`);
    },
}

const available_types = ["String", "Number", "Boolean", "Array", "Object", "Any"];

function type_of(data, type) {
    switch (type) {
        case "Boolean":
            return typeof data === "boolean";
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

const type_of_init = fb("Any", ["String", "Any"], function type_of_init(type, value) {
    if (type_of(value, type)) return value;

    // Why?... idk
    ERROR_MSG.Function(`type_of_init`, `You have set a wrong type to a variable [wanted: ${type}, given: ${get_type(value)}]. Be careful it can throw error in the future! :-)`);
    return value;
});

const instance_of_init = fb("Any", [Function, "Any"], function instance_of_init(instance, value) {
    if (instance_of(value, instance)) return value;

    // Why?... idk
    ERROR_MSG.Function(`instance_of_init`, `You have set a wrong instance to a variable [wanted: ${instance?.name}]. Be careful it can throw error in the future! :-)`);
    return value;
})

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

function fb(return_type, parameters_type, callback) {
    function is_a_regular_type(type, error_message = false) {
        const is_it = available_types.findIndex(t => type === t) !== -1;
        // more useless stuff??? yeah!!! idk...
        if (error_message && !is_it) {
            ERROR_MSG.Function(`fb::${is_a_regular_type.name}()`, `Be careful! You mispelled a type. Maybe you wanted to type one of those types [given: ${type}][available: ${available_types}]`);
        }

        return is_it;
    }

    // Do we return the value or not ??? In case an error is detected
    let do_return_value = true;
    const set_return_value_false = () => { do_return_value = false; }

    if (return_type === null || return_type === undefined) {
        set_return_value_false();
        ERROR_MSG.Function(`fb::return_type`, "The return type should not be empty.");
    }

    if (parameters_type === null || parameters_type === undefined) {
        set_return_value_false();
        ERROR_MSG.Function(`fb::parameter_type`, "The parameter types should not be empty.");
    }

    if (callback === null || callback === undefined) {
        set_return_value_false();
        ERROR_MSG.Function(`fb::callback`, "The callback type should not be empty.");
    }

    if (!instance_of(callback, Function)) {
        set_return_value_false();
        ERROR_MSG.Function(`fb::callback`, "The callback should be a Function.");
    }

    if (!do_return_value) return;

    return function fb__callback_exe(...args) {

        if (args.length != callback.length) {
            set_return_value_false();
            ERROR_MSG.Function(`fb::${fb__callback_exe.name}`, "Numbers of given values not matching callback arguments numbers");
        }

        const cb_return_value = callback.apply(null, args);

        // return_type checking
        {
            if (type_of(return_type, "String")) {
                // This is a regular type
                if (is_a_regular_type(return_type, true)) {
                    if (!type_of(cb_return_value, return_type)) {
                        set_return_value_false();
                        ERROR_MSG.Function(callback.name ? `fb::return_type::${callback.name}` : "fb::return_type::callback()", "Callback doesn't return the type wanted.");
                    }
                }
            } else {
                try {
                    if (!instance_of(cb_return_value, return_type)) {
                        set_return_value_false();
                        ERROR_MSG.Function(callback.name ? `fb::return_type::${callback.name}` : "fb::return_type::callback()", "Callback doesn't return the instance wanted.");
                    }
                } catch(e) {
                    set_return_value_false();
                    ERROR_MSG.Function(callback.name ? `fb::return_type::${callback.name}` : "fb::return_type::callback()", "Wrong syntax.");
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
                ERROR_MSG.Function(`fb::${fb__callback_exe.name}`, "Numbers of arguments used in the callback function call are different than parameters types given");
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
                            callback.name ? `fb::parameter_type::${callback.name}` : "fb::parameter_type::callback()",
                            `callback parameter not matching with Type needed [given: ${get_type(args[index])}, wanted: ${type_or_instance}]`
                        );
                    }
                    // Instance matching
                } else {
                    try {
                        if (!instance_of(args[index], type_or_instance)) {
                            set_return_value_false();
                            ERROR_MSG.Function(
                                callback.name ? `fb::parameter_type::${callback.name}` : "fb::parameter_type::callback()",
                                `callback parameter not matching with Instance needed [given: ${args[index]}, wanted: ${type_or_instance.name}]`
                            );
                        }
                    } catch (e) {
                        set_return_value_false();
                        ERROR_MSG.Function(
                            callback.name ? `fb::parameter_type::${callback.name}` : "fb::parameter_type::callback()",
                            `Wrong syntax`
                        );
                    }
                }
            }
        }

        // Atfer all those verifications we can gladly send the return value!
        if (do_return_value) {
            return cb_return_value;
        }
    }
};

// Game
{
    const array_add = fb("Array", ["Array", "Any"], function array_add(arr, value) {
        arr.push(value);
        return arr;
    });

    const puzzles = [];

    class Puzzle {
        constructor(name = "no_name_puzzle", width = 0, height = 0, ) {

        }
    }

    class Cell {
        #CELL_TYPE = " ";
        #AVAILABLE_CELLS = {
            ' ': "VOID",
            'X': 'WALL',
            'G': 'GOAL',
            '0': 'OBSTACLES',
            '#': 'PLAYER'
        }

        constructor(type, x, y) {
            this.x = type_of_init("Number", x);
            this.y = type_of_init("Number", y);
            if (Object.keys(this.#AVAILABLE_CELLS).findIndex(t => t === type) === -1) throw Error(`WRONG CELL TYPE. Available => [${Object.keys(this.#AVAILABLE_CELLS)}] Given => ${type}`)
            this.type = type;
        }
    }

    const cell = new Cell(' ', 0);

    const change_puzzle_cell = fb(Puzzle, [Puzzle, "Number", "Number"], function change_puzzle_cell(puzzle, x, y, cell) {

    })

    const add_puzzle = fb("Any", Puzzle, function add_puzzle(puzzle) {
        array_add(puzzles, puzzle);
    });

    const display_puzzle = fb("Any", Puzzle, function display_puzzle(puzzle) {

    });

    (function game_loop() {
        // Setup
        {
            console.log("Welcome to this puzzle game!");
            add_puzzle(new Puzzle());
        }
    })();
}
