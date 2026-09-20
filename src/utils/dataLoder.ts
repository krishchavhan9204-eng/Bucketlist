import Papa from "papaparse";

export const fetchCSV = <T>(url: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true, // Converts rows into JavaScript objects using headers
      dynamicTyping: true, // Automatically converts strings to numbers/booleans
      complete: (results) => resolve(results.data as T[]),
      error: (error) => reject(error),
    });
  });
};
