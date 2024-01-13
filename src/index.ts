const LANG_COLOR = {
  production:
    "https://raw.githubusercontent.com/ozh/github-colors/master/colors.json",
  dev: "./colors.json",
};

const LANG_API = {
  production: (owner: string, repo: string) =>
    `https://api.github.com/repos/${owner}/${repo}/languages`,
  dev: (_owner: string, _repo: string) => "./langs.json",
};

type LangApi = {
  [key: string]: number;
};

type LangColorApi = {
  [key: string]: {
    color: string;
  };
};

type ComposedLang = {
  name: string;
  y: number;
  color: string;
}[];

async function map<T, U>(
  prev: Promise<T>,
  applicative: (input: T) => U,
): Promise<U> {
  const output = await prev;
  return applicative(output);
}

async function zip<T, U, V>(
  left: Promise<T>,
  right: Promise<U>,
  applicative: (left: T, right: U) => V,
): Promise<V> {
  const output = await Promise.all([left, right]);
  return applicative(output[0], output[1]);
}

function uNull2<T, U, V>(
  fun: (left: T, right: U) => V,
): (left: T | null, right: U | null) => V | null {
  return (left, right) => {
    if (left == null || right == null) {
      return null;
    } else {
      return fun(left, right);
    }
  };
}

async function getData<ReturnType>(url: string): Promise<ReturnType | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const outputData: ReturnType = await response.json();
    return outputData;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function nRound(value: number, size: number): number {
  if (size == 0) {
    return Math.round(value);
  } else {
    return nRound(value * 10, size - 1) / 10;
  }
}

const normalize = (input: LangApi | null) => {
  if (input == null) {
    return null;
  }
  const sum = Object.values(input).reduce((a, b) => a + b);
  const output: LangApi = {};
  Object.keys(input).forEach(
    (key) => (output[key] = nRound((input[key] * 100) / sum, 3)),
  );
  return output;
};

function composeApi(langs: LangApi, colors: LangColorApi): ComposedLang {
  return Object.entries(langs).map((entry) => {
    const [key, value] = entry;
    return { name: key, y: value, color: colors[key].color };
  });
}

// -----------------------------------------------------------------------------------------

async function processedData(
  env: "production" | "dev",
): Promise<[string, ComposedLang, string | null] | null> {
  const queryParams = new URLSearchParams(window.location.search);

  const title = queryParams.get("title") ?? "Languages";
  const repo = queryParams.get("repo");
  const owner = queryParams.get("owner");
  const color = queryParams.get("color");

  console.log([repo, owner]);

  const lang_url = uNull2(LANG_API[env])(owner, repo);
  if (lang_url == null) {
    return null;
  } else {
    return zip(
      map(getData<LangApi>(lang_url), normalize),
      getData<LangColorApi>(LANG_COLOR[env]),
      uNull2(composeApi),
    ).then((result) => {
      if (result == null) {
        return null;
      } else {
        return [title, result, color];
      }
    });
  }
}
