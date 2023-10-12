import { EventEmitter } from 'events';

type StreamParserCallback = (value: ReadableStreamReadResult<any>) => void | PromiseLike<void>;

interface OnEvents {
  (event: 'done', listener: (records: string[][]) => unknown): unknown
  (event: 'error', listener: (error: unknown) => unknown): unknown
  (event: 'row-parsed', listener: (row: string[], index: number) => unknown): unknown
}

const splitStringToLines = (inputData: string) => {
  // Use the split method with a regular expression to split the input string into an array of lines.
  let lines = inputData.split(/\r?\n/);

  // Remove any leading or trailing whitespace from each line.
  // Remove any empty lines.
  lines = lines.map((line) => line.trim()).filter(Boolean);
  return lines;
}

const parseColItem = (data = '') => {
  return data.replace(/(^")|("$)/gm, '').replace(/"{2}/gm, '"');
}

const parseCsvRow = (inputString: string) => {
  const regex = /("[^"]*"|[^,]+)(?:,|$)/g;
  const result = [];
  let match;

  while ((match = regex.exec(inputString)) !== null) {
    const item = match[1].replace(/,$/, '')
    result.push(parseColItem(item));
  }
  return result;
}

/**
 * 
 * @param reader 
 * Available events:\
 * row-parsed - executes on each row. pass single record as callback parameter\
 * done - executes on file parsed. pass records as callback parameter\
 * error - executes on any error happened
 * @returns {
 *  on: Function\
 *  promise: Function
 * }
 */
export const parseReadableStream = (reader: ReadableStreamDefaultReader) => {
  const events = new EventEmitter()
  const records: string[][] = [];
  let index = 0;
  let csvData = '';

  const parseStrLines = (lines: string[]) => {
    lines.forEach((lineStr) => {
      const record = parseCsvRow(lineStr);
      records.push(record);
      events.emit('row-parsed', record, index);
      index += 1;
    })
  }

  const parseStreamChunk: StreamParserCallback = ({ done, value }) => {
    if (done) {
      const lines = splitStringToLines(csvData);
      parseStrLines(lines);
      return
    };
    csvData += Buffer.from(value).toString('utf-8');

    const lines = splitStringToLines(csvData);
    if (lines.length > 1) {
      csvData = lines.pop();
      parseStrLines(lines);
    }

    // Read some more, and call this function again
    return reader.read().then(parseStreamChunk)
  }

  const promise = new Promise<string[][]>((resolve, reject) => {
    reader.read()
      .then(parseStreamChunk)
      .then(() => {
        events.emit('done', records);
        resolve(records);
      })
      .catch((error) => {
        events.emit('error', error);
        reject(error);
      })
  })

  const on: OnEvents = (eventName, listener) => {
    events.on(eventName, listener)
  }

  return {
    on,
    promise: () => promise
  }
}