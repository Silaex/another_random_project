/**
 *  author of this mess: @Silaex (github.com/silaex) :-)
 *  goal: none
 */

const ERROR_MSG = {
    Function: (function_name, err_message) => {
        throw Error(`[Function::${function_name}] ${err_message} [don't forget to check error's stack below for more information]`);
    },
    Class: (class_name, err_message) => {
        throw Error(`[Class::${class_name}] ${err_message} [don't forget to check error's stack below for more information]`);
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

function is_instance(instance) {
    try {
        const a = instance instanceof Number
    } catch (e) {
        return false;
    }

    return true;
};

const type_of_init = fn("Any", ["String", "Any", "String"], function type_of_init(type, value, more_info) {
    if (type_of(value, type)) return value;
    // Why?... idk
    ERROR_MSG.Function(`type_of_init::${more_info}`, `You have set a wrong type to a variable [wanted: ${type}, given: ${get_type(value)}].`);
    return null;
});

const instance_of_init = fn("Any", ["Any", "Any"], function instance_of_init(instance, value) {
    if (instance_of(value, instance)) return value;

    // Why?... idk
    ERROR_MSG.Function(`instance_of_init`, `You have set a wrong instance to a variable [wanted: ${instance?.name}].`);
    return value;
})

function instance_of(data, instance) {
    if (!is_instance(instance)) {
        ERROR_MSG.Function("instance_of", "You have not given an instance here");
    }
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

function fn(return_type, parameters_type, callback) {
    function is_a_regular_type(type, error_message = false) {
        const is_it = available_types.findIndex(t => type === t) !== -1;
        // more useless stuff??? yeah!!! idk...
        if (error_message && !is_it) {
            ERROR_MSG.Function(`fn::${is_a_regular_type.name}()`, `Be careful! You mispelled a type. Maybe you wanted to type one of those types [given: ${type}][available: ${available_types}]`);
        }

        return is_it;
    }

    // letting the option to put only ONE parameter type without puttin an array
    let param_types = parameters_type;

    if (!type_of(parameters_type, "Array")) {
        param_types = Array(param_types);
    }

    // Do we return the value or not ??? In case an error is detected
    let do_return_value = true;
    const set_return_value_false = () => { do_return_value = false; }

    if (return_type === null || return_type === undefined) {
        set_return_value_false();
        ERROR_MSG.Function(`fn::return_type`, "The return type should not be empty.");
    }

    if (parameters_type === null || parameters_type === undefined) {
        set_return_value_false();
        ERROR_MSG.Function(`fn::parameter_type`, "The parameter types should not be empty.");
    }

    if (callback === null || callback === undefined) {
        set_return_value_false();
        ERROR_MSG.Function(`fn::callback`, "The callback type should not be empty.");
    }

    if (!instance_of(callback, Function)) {
        set_return_value_false();
        ERROR_MSG.Function(`fn::callback`, "The callback should be a Function.");
    }

    if (!do_return_value) return;

    return function fn__callback_exe(...args) {

        // This code is kinda useless because it removes the possibility to make "optional argument"
        // if (args.length != callback.length) {
        //     set_return_value_false();
        //     ERROR_MSG.Function(`fn::${fn__callback_exe.name}`, "Numbers of given values not matching callback arguments numbers");
        // }


        // We have to put type default value to arguments for not given parameters
        // Why??? idk...
        for (var i = 0; i < param_types.length; i++) {
            const arg = args[i];
            const type = param_types[i];

            if (is_a_regular_type(type)) {
                if (type === "Array" && arg === undefined) args[i] = [];
                if (type === "Object" && arg === undefined) args[i] = {};
                if (type === "String" && arg === undefined) args[i] = "";
                if (type === "Number" && arg === undefined) args[i] = 0;
                // For Boolean and Any it will stay on <<undefined>>
            } else {
                // If an instance it will be null
                if (arg === undefined) args[i] = null;
            }
        }
        const cb_return_value = callback.apply(null, args);

        // return_type checking
        {
            if (type_of(return_type, "String")) {
                // This is a regular type
                if (is_a_regular_type(return_type, true)) {
                    if (!type_of(cb_return_value, return_type)) {
                        set_return_value_false();
                        ERROR_MSG.Function(callback.name ? `fn::return_type::${callback.name}` : "fn::return_type::callback()", "Callback doesn't return the type wanted.");
                    }
                }
            } else {
                if (!instance_of(cb_return_value, return_type)) {
                    set_return_value_false();
                    ERROR_MSG.Function(callback.name ? `fn::return_type::${callback.name}` : "fn::return_type::callback()", "Callback doesn't return the instance wanted.");
                }
            }
        }

        // parameters_type checking
        {
            // Same as for callback parameter length. Maybe needs some liberty on it
            // if (args.length != param_types.length) {
                //     set_return_value_false();
                //     ERROR_MSG.Function(`fn::${fn__callback_exe.name}`, "Numbers of arguments used in the callback function call are different than parameters types given");
                // }

                for (let index = 0; index < param_types.length; index++) {
                    const type_or_instance = param_types[index];

                    if (type_of(type_or_instance, "String")) {
                        // Type checking
                        // Here just to warn about the mispelling if there is one
                        is_a_regular_type(type_or_instance, true);

                        if (!type_of(args[index], type_or_instance)) {
                            set_return_value_false();
                            ERROR_MSG.Function(
                                callback.name ? `fn::parameter_type::${callback.name}` : "fn::parameter_type::callback()",
                                `callback parameter not matching with Type needed [given: ${get_type(args[index])}, wanted: ${type_or_instance}]`
                            );
                        }
                    } else {
                        // Instance matching
                        if (!instance_of(args[index], type_or_instance)) {
                            set_return_value_false();
                            ERROR_MSG.Function(
                                callback.name ? `fn::parameter_type::${callback.name}` : "fn::parameter_type::callback()",
                                `callback parameter not matching with Instance needed [given: ${args[index]}, wanted: ${type_or_instance.name}]`
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

const create_element = fn(HTMLElement, ["String", "Object", "Array"], function create_element(type, properties, childrens) {
    if (!type) ERROR_MSG.Function("create_element", "Give at least a type :-O");
    const element = document.createElement(type);

    for (const property in properties) {
        if (properties.hasOwnProperty(property)) {
            element[property] = properties[property];
        }
    }

    return element;
});

// Computer
const append_element = fn(HTMLElement, [HTMLElement, "Array"], function append_element(parent, childrens) {
    
});


// Console Puzzle Game
{
    const quit = false;
    const command = null;
    let ctrl_pressed = false;
    let shift_pressed = false;
    let current_player = null;
    let current_puzzle = null;
    let current_map = null;

    // Have to be outside (can't access with "this" keyword because of function_builder)
    const debug_messages = [];
    const DEBUG = {
        write: fn("Any", "Any", (msg) => {
            debug_messages.push(msg);
            return msg;
        }),
        show: fn("Array", [], function show() {
            console.log("↓↓↓ debug log ↓↓↓");

            debug_messages.forEach((msg) => {
                console.log(msg);
            });

            console.log("↑↑↑ debug log ↑↑↑");

            return debug_messages;
        })
    }

    const array_add = fn("Array", ["Array", "Any"], function array_add(arr, value) {
        arr.push(value);
        return arr;
    });

    const object_add = fn("Object", ["Object", "String", "Any"], function object_add(obj, key, value) {
        obj[key] = value;
        return obj;
    });

    const puzzles = {};

    class Puzzle {
        constructor(name = "no_name_puzzle", width, height) {
            // already existing name checking block
            {
                const puzzle = puzzle_exists(name);

                if (!puzzle) {
                    this.name = type_of_init("String", name, "puzzle_name");
                } else {
                    ERROR_MSG.Class("Puzzle", "This name already taken!")
                }
            }
            this.width = type_of_init("Number", width, "puzzle_width");
            this.height = type_of_init("Number", height, "puzzle_height");
            this.cells = [];
            for (let y = 0; y < width; y++) {
                for (let x = 0; x < height; x++) {
                    array_add(this.cells, new Cell(" ", x, y));
                }
            }
        }
    }

    const AVAILABLE_CELLS = {
        ' ': "VOID",
        'X': 'WALL',
        'G': 'GOAL',
        '0': 'OBSTACLES',
        '#': 'PLAYER'
    }

    const SYMBOL_CELLS = {
        "VOID": ' ',
        "WALL": 'X',
        "GOAL": 'G',
        "OBSTACLES": '0',
        "PLAYER": '#',
    }

    class Cell {

        constructor(symbol, x, y) {
            this.symbol = type_of_init("String", symbol, "cell_symbol");
            if (Object.keys(AVAILABLE_CELLS).findIndex(t => t === symbol) === -1) throw Error(`WRONG CELL TYPE. Available => [${Object.keys(AVAILABLE_CELLS)}] Given => ${symbol}`)
            this.name = AVAILABLE_CELLS[symbol];
            this.x = type_of_init("Number", x, "cell_x");
            this.y = type_of_init("Number", y, "cell_y");
        }
    }

    // log the cell symbol by giving puzzle and coordinates
    const show_cell = fn(Cell, [Puzzle, "Number", "Number"], function show_cell(puzzle, x, y) {
        const cell = puzzle.cells[(puzzle.width*y)+x];
        return cell;
    });

    const puzzle_modify_cell_symbol = fn(Puzzle, [Puzzle, Cell, "String"], function puzzle_modify_cell_symbol(puzzle, cell, symbol) {
        if (!Object.keys(AVAILABLE_CELLS).find(s => s === symbol)) {
            ERROR_MSG.Function("puzzle_modify_cell_symbol", "Wrong symbol");
        }

        cell.symbol = symbol;

        DEBUG.write(`Symbol of the cell ${cell.x}:${cell.y} has been modified succesfully!`);

        return puzzle;
    });

    const add_puzzle = fn(Puzzle, Puzzle, function add_puzzle(puzzle) {
        object_add(puzzles, puzzle.name, puzzle);
        return puzzle;
    });

    const load_puzzle = fn(Puzzle, Puzzle, function load_puzzle(puzzle) {
        console.log(`Puzzle <<${puzzle.name}>> is loaded!`);
        console.log(get_puzzle_display_string(puzzle));
        return puzzle;
    });

    const puzzle_exists = fn("Boolean", "String", function puzzle_exists(puzzle_name) {
        return Object.keys(puzzles).findIndex(p => p === puzzle_name) !== -1;
    });

    const get_puzzle = fn(Puzzle, "String", function get_puzzle(puzzle_name) {
        if (!puzzle_exists(puzzle_name)) {
            ERROR_MSG.Function("get_puzzle", `Puzzle "${puzzle_name}" is unknown.`);
        }

        return puzzles[puzzle_name];
    });

    const get_puzzle_display_string = fn("String", Puzzle, function get_puzzle_display_string(puzzle) {
        let display = "";

        for (let y = 0; y < puzzle.height; y++) {
            for (let x = 0; x < puzzle.width; x++) {
                const cell = puzzle.cells[(puzzle.width*y)+x];
                display += cell.symbol;
            }
            display += "\n"
        }

        return display;
    });

    const puzzle_string_array_to_cells_array = fn("Array", [Puzzle, "Array"], function puzzle_string_array_to_cells_array(puzzle, puzzle_str_array) {
        const cells_array = [];

        // verifying if this is the same size as set
        if (puzzle.height !== puzzle_str_array.length) {
            ERROR_MSG.Function("parsing_puzzle_cell_building", "Given puzzle array string height is not the same as given puzzle height");
        }
        for (var i = 0; i < puzzle_str_array.length; i++) {
            const width = puzzle_str_array[i].length;
            if (puzzle.width !== width) {
                ERROR_MSG.Function("parsing_puzzle_cell_building", "There are differences between given puzzle width and puzzle string array");
            }

            // Check if there is a character that is not in available cells
            for (var j = 0; j < puzzle_str_array[i].length; j++) {
                const cell_string = puzzle_str_array[i][j];
                if (Object.keys(AVAILABLE_CELLS).includes(cell_string)) {
                    cells_array.push(new Cell(cell_string, j, i));
                } else {
                    ERROR_MSG.Function("parsing_puzzle_cell_building", "There is an unknown cell in the string array")
                }
            }
        }

        return cells_array;
    });

    const puzzle_get_cell = fn(Cell, [Puzzle, "Number", "Number"], function puzzle_get_cell(puzzle, x, y) {
        const cell = puzzle.cells[puzzle.width*y + x];

        if (!cell) {
            ERROR_MSG.Function("puzzle_get_cell", "No cell here!");
        }

        return cell;
    });

    const get_player_cell = fn(Cell, Puzzle, function get_player_cell(puzzle) {
        const player = puzzle.cells.find(c => c.symbol === "#");

        if (!player) {
            ERROR_MSG.Function("player_update", "There is no player in this map!");
        }

        return player;
    });

    const player_move = fn(Cell, [Puzzle, Cell, "String"], function player_move(puzzle, player_cell, direction) {
        // Before everything we will check if it collide with something
        const destination_cell = puzzle_get_cell(puzzle, player_cell.x-1, player_cell.y-1);
        console.log(destination_cell);

        switch (direction) {
            case "right":

                break;
            case "left":

                break;
            case "up":

                break;
            case "down":

                break;
            default:

        }

        game_update();
        // Display the map
        console.log(current_map);

        return player_cell;
    });

    const game_update = fn("Any", [], function game_update() {
        current_map = get_puzzle_display_string(current_puzzle);
        current_player = get_player_cell(current_puzzle);
    });

    document.addEventListener("keydown", function(event) {
        const KEY = event.key;

        if (KEY === "Control") ctrl_pressed = true;
        if (KEY === "Shift") shift_pressed = true;

        const command_prompt_shortcut = ctrl_pressed && shift_pressed && KEY === "O";

        if (command_prompt_shortcut) {
            const command = prompt("Command:");

            switch (command) {
                case "show debug":
                    DEBUG.show();
                    break;
                default:

            }
        }
    });

    document.addEventListener("keyup", function(event) {
        const KEY = event.key;

        // PLAYER MOVEMENT
        {
            const KEY_DIRECTION = {
                "ArrowRight": { x: 1, y: 0 },
                "ArrowLeft" : { x: -1, y: 0 },
                "ArrowUp"   : { x: 0, y: -1 },
                "ArrowDown" : { x: 0, y: 1 },
            }
            const direction = KEY_DIRECTION[KEY] || null;

            if (direction !== null) {
                const destination_cell = puzzle_get_cell(
                    current_puzzle,
                    current_player.x + direction.x,
                    current_player.y + direction.y
                );

                const destination_cell_symbol = destination_cell.symbol;

                if (destination_cell_symbol === SYMBOL_CELLS.VOID) {
                    puzzle_modify_cell_symbol(current_puzzle, destination_cell, current_player.symbol);
                    puzzle_modify_cell_symbol(current_puzzle, current_player, destination_cell_symbol);
                }

                if (destination_cell_symbol === SYMBOL_CELLS.OBSTACLES) {
                    const obstacle_destination_cell = puzzle_get_cell(
                        current_puzzle,
                        destination_cell.x + direction.x,
                        destination_cell.y + direction.y
                    );

                    if (obstacle_destination_cell.symbol === SYMBOL_CELLS.VOID) {
                        puzzle_modify_cell_symbol(current_puzzle, obstacle_destination_cell, SYMBOL_CELLS.OBSTACLES);
                        puzzle_modify_cell_symbol(current_puzzle, destination_cell, current_player.symbol);
                        puzzle_modify_cell_symbol(current_puzzle, current_player, SYMBOL_CELLS.VOID);
                    }
                }

                game_update();
                console.clear();
                console.log(`%c${get_puzzle_display_string(current_puzzle)}`, "font-size: 16px;")
            }
        }

        if (KEY === "Control") ctrl_pressed = false;
        if (KEY === "Shift") shift_pressed = false;
    });

    // Setup
    {
        console.log("Welcome to the random project!");

        const q = [
            "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "XXXXXXXXXX         XXXXXXXXXXX",
            "XXXXXXXXXX XXXXXXX XXXXXXXXXXX",
            "XXXX       XXXX   #  XXXXXXXXX",
            "XXXX   0   XXXX      XXXXXXXXX",
            "XXXX       XXXXXXXXXXXXXXXXXXX",
            "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        ]
        current_puzzle = add_puzzle(new Puzzle("first puzzle", 30, 10));
        current_puzzle.cells = puzzle_string_array_to_cells_array(current_puzzle, q);
        console.log(`%c${get_puzzle_display_string(current_puzzle)}`, "font-size: 16px;")
        current_player = get_player_cell(current_puzzle);
    }

}
