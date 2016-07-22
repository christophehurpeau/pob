let enabled = false;
const ora = require('ora');

module.exports = class Task {
    constructor(name) {
        if (!enabled) return;
        this._name = name;
        this.spinner = ora({
            enabled: enabled,
            text: name,
            interval: 600,
        }).start();
    }

    set name(name) {
        if (!enabled) return;
        this._name = name;
        this.spinner.text = name;
        this.spinner.render();
    }

    subtask(name) {
        if (!enabled) return { done() {} };
        const text = `${this._name} → ${name}`;
        this.spinner.text = text;
        this.spinner.render();
        return {
            done: () => {
                process.nextTick(() => {
                    if (this.spinner.text === text) {
                        this.spinner.text = this._name;
                    }
                });
            }
        }
    }

    succeed() {
        if (!enabled) return;
        this.spinner.text = this._name;
        this.spinner.succeed();
    }
};

module.exports.enable = () => enabled = true;
