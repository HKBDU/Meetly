const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/

export function formatDateforApi(date: Date | string) : string {
  // case YYYY-MM-DD
  if (typeof date === 'string' && DATE_PATTERN.test(date)){
    return date;
  }

  /*
  * YYYY-MM-DD, YYYY/MM/DD 
  * YYYY-MM-THH:mm:ss.sssZ
  * YYYY-MM-THH:mm:ss+HH:MM 
  * YYYY-MM, YYYY 
  * "Sep 10, 2026", "September 10 2026", "10 Sep 2026"
  * "Thu Sep 10 2026 15:30:00 GMT+0700"
  */
  const value = (typeof date === 'string') ? new Date(date) : date
  const day = value.getDay();
  const month = value.getMonth();
  const year = value.getFullYear();
  return year + "-" + month + "-" + day;
}

export function generateDateRange(start: Date, numberOfDays: number) : string[]{
  const result: string[] = [];
  const current = new Date(start); // avoid mutating
  for (let i = 0; i < numberOfDays; i++){
    result.push(formatDateforApi(current))
    current.setDate(current.getDate() + 1)
  }

  return result;
}

export function isFutureDate(candidateDate: Date | string) : boolean {
  const candidate = (typeof candidateDate === 'string'
                                               ? new Date(candidateDate + 'T00:00:00') 
                                               : new Date(candidateDate) )
  // T00:00:00 avoid ISO 8601 Date Parsing Ambiguity
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  candidate.setHours(0, 0, 0, 0);
  return today < candidate;
}

export function isPastDate(candidateDate: Date | string) : boolean {
  const candidate = (typeof candidateDate === 'string'
                                               ? new Date(candidateDate + 'T00:00:00') 
                                               : new Date(candidateDate) )
  // T00:00:00 avoid ISO 8601 Date Parsing Ambiguity
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  candidate.setHours(0, 0, 0, 0);
  return today > candidate;
}