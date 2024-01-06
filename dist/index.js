"use strict";
const LANG_COLOR = {
    production: "https://raw.githubusercontent.com/ozh/github-colors/master/colors.json",
    dev: "./colors.json",
};
const LANG_API = {
    production: (owner, repo) => `https://api.github.com/repos/${owner}/${repo}/languages`,
    dev: (_owner, _repo) => "./langs.json",
};
async function map(prev, applicative) {
    const output = await prev;
    return applicative(output);
}
async function zip(left, right, applicative) {
    const output = await Promise.all([left, right]);
    return applicative(output[0], output[1]);
}
function uNull2(fun) {
    return (left, right) => {
        if (left == null || right == null) {
            return null;
        }
        else {
            return fun(left, right);
        }
    };
}
async function getData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }
        const outputData = await response.json();
        return outputData;
    }
    catch (error) {
        console.error(error);
        return null;
    }
}
function nRound(value, size) {
    if (size == 0) {
        return Math.round(value);
    }
    else {
        return nRound(value * 10, size - 1) / 10;
    }
}
const normalize = (input) => {
    if (input == null) {
        return null;
    }
    const sum = Object.values(input).reduce((a, b) => a + b);
    const output = {};
    Object.keys(input).forEach((key) => (output[key] = nRound((input[key] * 100) / sum, 3)));
    return output;
};
function composeApi(langs, colors) {
    return Object.entries(langs).map((entry) => {
        const [key, value] = entry;
        return { name: key, y: value, color: colors[key].color };
    });
}
// -----------------------------------------------------------------------------------------
async function processedData(env) {
    var _a;
    const queryParams = new URLSearchParams(window.location.search);
    const title = (_a = queryParams.get("title")) !== null && _a !== void 0 ? _a : "Languages";
    const repo = queryParams.get("repo");
    const owner = queryParams.get("owner");
    console.log([repo, owner]);
    const lang_url = uNull2(LANG_API[env])(owner, repo);
    if (lang_url == null) {
        return null;
    }
    else {
        return zip(map(getData(lang_url), normalize), getData(LANG_COLOR[env]), uNull2(composeApi)).then((result) => {
            if (result == null) {
                return null;
            }
            else {
                return [title, result];
            }
        });
    }
}
