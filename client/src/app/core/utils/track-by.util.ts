export function trackById<T extends { id: string | number }>(_index: number, item: T): string | number {
  return item.id;
}

export function trackByIndex(index: number): number {
  return index;
}

export function trackByValue<T>(_index: number, value: T): T {
  return value;
}
