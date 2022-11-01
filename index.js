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
    if (data === undefined) return "undefined";

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

function _regex(regex, str) {
    const results = [];
    let result;
    while (result = regex.exec(str)) {
        results.push(result);
    }

    return {
        results: results,
        indexes: results.map(r => r.index)
    };
}

// A typed function builder... OMG BUT THERE IS TYPESCRIPT WHY DOING THIS????????.... Bad programmer.... :-)
// parameter "context" is useful for when you use this function in classes
function fn(return_type, parameters_type, callback, context = null) {
    function is_a_regular_type(type, error_message = false) {
        const is_it = available_types.findIndex(t => type === t) !== -1 || String(type).startsWith("Array");
        // more useless stuff??? yeah!!! idk...
        if (error_message && !is_it) {
            ERROR_MSG.Function(`fn::${is_a_regular_type.name}()`, `Be careful! You mispelled a type. Maybe you wanted to type one of those types [given: ${type}][available: ${available_types}]`);
        }

        return is_it;
    }

    // letting the option to put only ONE parameter type without putting an array
    let param_types = parameters_type;

    if (!type_of(parameters_type, "Array")) {
        param_types = Array(param_types);
    }

    if (return_type === null || return_type === undefined) {
        ERROR_MSG.Function(`fn::return_type`, "The return type should not be empty.");
    }

    if (parameters_type === null || parameters_type === undefined) {
        ERROR_MSG.Function(`fn::parameter_type`, "The parameter types should not be empty.");
    }

    if (callback === null || callback === undefined) {
        ERROR_MSG.Function(`fn::callback`, "The callback type should not be empty.");
    }

    if (!instance_of(callback, Function)) {
        ERROR_MSG.Function(`fn::callback`, "The callback should be a Function.");
    }

    if (!type_of(context, "Object")) {
        ERROR_MSG.Function(`fn::context`, "The context should be an object.");
    }

    // ####################################### ⬇⬇⬇⬇⬇⬇ Array Syntax Checking ⬇⬇⬇⬇⬇⬇ ##############################################################
    // Must build a unique way for checking the Array Syntax "Array::Array::Type" or "Array<Array<Type>>"
    // Filter to have only the Array ones
    const array_params_indexes = [];
    const array_params = param_types.filter((param, index) => {
        if (type_of(param, "String") && param.startsWith("Array")) {
            // disgusting way to do maybe but i'm not here to apply to your company
            array_params_indexes.push(index);
            return param;
        }
    });

    const regex_begin = /</gi;
    const regex_end = />/gi;
    let results_begin = [];
    let results_end = [];
    const array_params_infos = [];

    array_params.forEach((param, i) => {
        results_begin = _regex(regex_begin, param).indexes;
        results_end = _regex(regex_end, param).indexes;

        // Same results array length checking between LESS EQUALS and GREATER THAN signs
        if (results_begin.length != results_end.length) {
            ERROR_MSG.Function(`fn{region:Array Syntax Checking}`, "Syntax Error");
        }

        let array_depth = results_begin.length;
        let array_check_offset = 0;
        let array_str = param;

        while (array_depth > 0) {
            if (array_depth === 1) {
                // we register the final type for checking in "fn__callback_exe"
                array_params_infos.push({
                    final_type: array_str.substring(results_begin[array_check_offset]+1, results_end[0]),
                    array_depth: results_begin.length
                });
            }

            array_check_offset++;
            array_depth--;
        }
    });

    // WARNING: If there is no CLASS or REGULAR TYPE checking for syntax is it because
    //          the param type is written in String so CLASS can't be checked or would need another syntax
    //          so WE (our solo team) prefers to check this in the callback use. :-) enjoy

    // ####################################### ￪￪￪￪￪￪ Array Syntax Checking ￪￪￪￪￪￪  ##############################################################

    return function fn__callback_exe(...args) {

        // This code is kinda useless because it removes the possibility to make "optional argument"
        // if (args.length != callback.length) {
        //     set_return_value_false();
        //     ERROR_MSG.Function(`fn::${fn__callback_exe.name}`, "Numbers of given values not matching callback arguments numbers");
        // }

        // Here we check if the final type and the depth of arrays are the same as given arguments
        array_params_infos.forEach(({ final_type, array_depth }, index) => {
            const array_arg_to_check = args[array_params_indexes[index]];
            // Check arrays layers
            if (!type_of(array_arg_to_check, "Array")) {
                ERROR_MSG.Function("fn__callback_exe", `[Given: ${get_type(array_arg_to_check)}, wanted: Array]`);
            }

            function array_inspector(array, depth) {
                for (let i = 0; i < array.length; i++) {
                    if (depth !== 0) {
                        if (!type_of(array[i], "Array")) {
                            // In case there is no array nested
                            if (array[i] === undefined) {
                                return;
                            }

                            // ERROR why there is not an array when it's expected ???
                            ERROR_MSG.Function("fn__callback_exe::array_inspector",
                                `You are nesting something that is not an array :-)`
                            );
                        } else {
                            array_inspector(array[i], depth-1);
                        }
                    } else {
                        if (final_type === "Any") {
                            return;
                        } else {
                            // Checking all elements type
                            for (let j = 0; j < array.length; j++) {
                                const element = array[j];
                                const element_type = get_type(element);
                                if (element_type !== final_type) {
                                    ERROR_MSG.Function("fn__callback_exe::array_inspector", `Wrong type used! [wanted: ${final_type}, given: ${element_type}]`);
                                }
                            }
                        }
                    }
                }
            }

            array_inspector(array_arg_to_check, array_depth-1);
            for (let i = array_depth-1; i > 0; i--) {
                if (array_arg_to_check.length - i > 0) {
                    continue;
                }
            }
        });

        // We have to put type default value to arguments for not given parameters
        // Why??? idk...
        for (let i = 0; i < param_types.length; i++) {
            const arg = args[i];
            const type = param_types[i];

            if (is_a_regular_type(type)) {
                if (type.startsWith("Array") && arg === undefined) args[i] = [];
                if (type === "Object" && arg === undefined) args[i] = {};
                if (type === "String" && arg === undefined) args[i] = "";
                if (type === "Number" && arg === undefined) args[i] = 0;
                // For Boolean and Any it will stay on <<undefined>>
            } else {
                // If an instance it will be null
                if (arg === undefined) args[i] = null;
            }
        }

        // Here we execute the callback function to get his rsult and analyze it below
        // The context parameter is useful for when the function is a class method
        const cb_return_value = callback.apply(context, args);

        // return_type checking
        {
            if (type_of(return_type, "String")) {
                // This is a regular type
                if (is_a_regular_type(return_type, true)) {
                    if (!type_of(cb_return_value, return_type)) {
                        ERROR_MSG.Function(callback.name ? `fn::return_type::${callback.name}` : "fn::return_type::callback()", "Callback doesn't return the type wanted.");
                    }
                }
            } else {
                if (!instance_of(cb_return_value, return_type)) {
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
                        if (!type_of(args[index], type_or_instance) && !type_or_instance.startsWith("Array")) {
                            ERROR_MSG.Function(
                                callback.name ? `fn::parameter_type::${callback.name}` : "fn::parameter_type::callback()",
                                `callback parameter not matching with Type needed [given: ${get_type(args[index])}, wanted: ${type_or_instance}]`
                            );
                        }
                    } else {
                        // Instance matching
                        if (!instance_of(args[index], type_or_instance)) {
                            ERROR_MSG.Function(
                                callback.name ? `fn::parameter_type::${callback.name}` : "fn::parameter_type::callback()",
                                `callback parameter not matching with Instance needed [given: ${args[index]}, wanted: ${type_or_instance.name}]`
                            );
                        }
                    }
                }
            }

        // Atfer all those verifications we can gladly send the return value!
        return cb_return_value;
    }
};

const array_add = fn("Array", ["Array", "Any"], function array_add(arr, value) {
    arr.push(value);
    return arr;
});

const object_add = fn("Object", ["Object", "String", "Any"], function object_add(obj, key, value) {
    obj[key] = value;
    return obj;
});

const object_type_inspector = fn("Object", ["String", "Object"], function object_type_inspector(type, object_to_inspect) {
    Object.keys(object_to_inspect).forEach(key => {
        if (!type_of(object_to_inspect[key]), type) {
            ERROR_MSG.Function("object_type_inspector", `Your object has another value type than the one asked [asked: ${type}]`);
        }
    });
    return object_to_inspect;
});

const object_instance_inspector = fn("Object", ["Any", "Object"], function object_instance_inspector(instance, object_to_inspect) {
    if (!is_instance(instance)) {
        ERROR_MSG.Function("object_instance_inspector", `You have not given an instance (class)`);
    }
    Object.keys(object_to_inspect).forEach(key => {
        if (!instance_of(object_to_inspect[key], instance)) {
            ERROR_MSG.Function("object_instance_inspector", `Your object has another value instance than the one asked [asked: ${instance.name}]`);
        }
    });
    return object_to_inspect;
});

// Computer
{
    // This is for preventing user to use right-click for building our own
    document.oncontextmenu = function(event) {
        event.preventDefault();
        return false;
    }

    const get_element_by_class = fn(HTMLElement, ["String"], function(class_name) {
        return document.getElementByClassName(class_name);
    });

    const get_element_by_id = fn(HTMLElement, ["String"], function(id) {
        return document.getElementById(id);
    });

    const create_element = fn(HTMLElement, ["String", "Object", "Array"], function create_element(type, properties, childrens) {
        if (!type) ERROR_MSG.Function("create_element", "Give at least a type :-O");
        const element = document.createElement(type);

        for (const property in properties) {
            if (property !== "style") {
                element[property] = properties[property];
            } else {
                for (const prop in properties[property]) {
                    element.style[prop] = properties[property][prop];
                }
            }
        }

        const ch = childrens;
        if (!Array.isArray(childrens)) {
            ch = Array(ch);
        }

        append_element(element, childrens);

        return element;
    });

    const create_event = fn("Any", [HTMLElement, "String", Function], function create_event(target, event_name, callback) {
        target.addEventListener(event_name, callback);
        return;
    });

    const append_element = fn(HTMLElement, [HTMLElement, "Array"], function append_element(parent, childrens) {
        parent.append(...childrens);
        return parent;
    });

    const html_root = get_element_by_id("root");

    const COMPUTER = {
        data: {
            mouse_x: 0,
            mouse_y: 0,
            mouse_pressed: false
        },
        errors: {
            // This is an error that is there but will it be used??? bah j'en sais rien
            unknown: "[Computer System::error::unknown] DID YOU DO SOMETHING WRONG!!!???",
            app_not_found: "[Computer System::error::app_not_found] This application has not been found!",
        },
        WINDOWS: [],
        FOLDERS: [],
        applications: {
            instances: {}
        },
        style: {
            WINDOW: {
                bg: {
                    main: "#f1f1f1",
                    title: "#222",
                    content: "transparent"
                }
            }
        }
    }

    // Event to get mouse coordinates
    create_event(document.body, "mousemove", function(e) {
        COMPUTER.data.mouse_x = e.x;
        COMPUTER.data.mouse_y = e.y;
    });
    create_event(document.body, "mousedown", function(e) {
        COMPUTER.data.mouse_pressed = true;
    });
    create_event(document.body, "mouseup", function(e) {
        COMPUTER.data.mouse_pressed = false;
    });

    class Win {
        constructor(width, height, name) {
            this.width = type_of_init("Number", width, "class::_Window::width");
            this.height = type_of_init("Number", height, "class::_Window::height");
            this.name = type_of_init("String", name, "class::_Window::name");

            const WINDOW_STYLE = {
                main: {
                    display: "flex",
                    flexDirection: "column",
                    width: width + "px",
                    minWidth: "420px",
                    height: height + "px",
                    minHeight: "360px",
                    borderRadius: "0px",
                    overflow: "hidden",
                    background: COMPUTER.style.WINDOW.bg.main,
                    border: "solid 3px" + COMPUTER.style.WINDOW.bg.title,
                    resize: "both"
                },
                title: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    height: "32px",
                    padding: "0 8px",
                    borderBottom: "solid 2px " + COMPUTER.style.WINDOW.bg.title,
                    background: COMPUTER.style.WINDOW.bg.title,
                    color: "#fff"
                },
                close_button: {
                    width: "12px",
                    height: "12px",
                    background: "#f22",
                    borderRadius: "50%",
                    cursor: "pointer"
                },
                content: {
                    flex: 1,
                    background: COMPUTER.style.WINDOW.bg.content,
                    overflowX: "hidden",
                    overflowY: "auto",
                    wordBreak: "break-word"
                }
            }

            const ce = create_element;

            this.HTML_ELEMENTS = {
                window_main: ce("div", { className: "window--main", style: WINDOW_STYLE.main }),
                window_title: ce("div", { className: "window--title", style: WINDOW_STYLE.title }),
                window_title_name: ce("div", { className: "window--title-name", textContent: "Window" }),
                window_close_button: ce("div", { className: "window--title-close", style: WINDOW_STYLE.close_button }),
                window_content: ce("div", { className: "window--content", style: WINDOW_STYLE.content }),
            }
            const th = this.HTML_ELEMENTS;
            console.log(append_element(th.window_title, [th.window_close_button]));
            this.HTML_STRUCTURE = append_element(th.window_main, [
                append_element(th.window_title, [
                    th.window_title_name,
                    th.window_close_button
                ]),
                th.window_content
            ]);

            create_event(this.HTML_ELEMENTS.window_main, "mouseleave", (e) => {
                this.width = parseInt(e.target.style.width);
                this.height = parseInt(e.target.style.height);
            });
            create_event(this.HTML_ELEMENTS.window_main, "mouseenter", (e) => {
                this.width = parseInt(e.target.style.width);
                this.height = parseInt(e.target.style.height);
            });
            create_event(this.HTML_ELEMENTS.window_close_button, "click", (e) => {
                this.close();
            });

            // window movement
            {
                create_event(this.HTML_ELEMENTS.window_title, "mousemove", (e) => {
                    const layer_x = e.layerX;
                    const layer_y = e.layerY;
                });
            }


            // We add the window to the computer UI list
            array_add(COMPUTER.WINDOWS, this);
        }

        show = fn(Win, [HTMLElement], function show(parent) {
            append_element(parent, [this.HTML_STRUCTURE]);
            return this;
        }, this);

        close = fn(Win, [], function close() {
            const index = COMPUTER.WINDOWS.indexOf(this);
            COMPUTER.WINDOWS.splice(index);
            this.HTML_STRUCTURE.remove();
            return this;
        }, this);

        add_content = fn(Win, "Object", function add_content(content) {
            for (const key in content) {
                if (Object.hasOwnProperty.call(content, key)) {
                    const element = content[key];
                    append_element(this.HTML_ELEMENTS.window_content, [element]);
                    object_add(this.HTML_ELEMENTS, key, element);
                }
            }
            
            return this;
        }, this);
    }

    class Application {
        constructor(name, window = undefined) {
            // MEMORY SIZE??? Strange man here
            this.name = type_of_init("String", name, "class::Application::name");
            this.properties = {};
            this.window = window;

            // If the application is not registered in the computer applications
            if (COMPUTER.applications[name] === undefined) {
                COMPUTER.applications[name] = {};
            } else {
                if (COMPUTER.applications[name][path] !== undefined) {
                    ERROR_MSG.Class("Application::constructor", "Another instance of this application is already there!");
                }
            }
            object_add(COMPUTER.applications[name], name, this);
        }

        open = fn(Application, [], function open() {
            // if this application has a window interface
            if (this.window) {
                this.window.HTML_ELEMENTS.window_title_name.textContent = this.name;
                this.window.show(html_root);
            }
            return this;
        }, this);
    }
    object_add(COMPUTER.applications, "__application_class__", Application);

    class File {
        constructor(name, path) {
            this.name = type_of_init("String", name, "class::Application::name");
            this.path = type_of_init("String", path, "class::Application::path");
            this.properties = {
                size: 0,
                path
            };
        }
    }

    const add_content_to_window = fn(Win, [Win, HTMLElement], function add_content_to_window(win, content) {
        append_element(win.HTML_ELEMENTS.content, content);
        return win;
    });

    const wind = new Win(1000, 500, "Window");
    const video_player = new Application("Video Player", wind);
    console.log(COMPUTER, video_player);
    video_player.window.add_content({
        video_player: create_element('video', { className: "application--video_player", src: "./videos/delawhere_deep_Space_love.mp4", controls: true, autoplay: true,
            style: { background: "#222", width: "100%", height: "100%", display: "block" },
        }),
    });
    video_player.open();
}

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
            array_add(debug_messages, msg);
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
                    array_add(cells_array, new Cell(cell_string, j, i));
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
            "XXXXXXX            XXXXXXXXXXX",
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
