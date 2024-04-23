type LoadableState<T> =
  | {
      status: "pending";
      promise: Promise<T>;
    }
  | {
      status: "fulfilled";
      data: T;
    }
  | {
      status: "rejected";
      error: unknown;
    };

export function LP<T>(promise: Promise<T>): Loadable<T> {
  return new Loadable({ type: "promise", promise: promise });
}
export function LV<T>(value: T): Loadable<T> {
  return new Loadable({ type: "value", value });
}

export class Loadable<T> {
  state: LoadableState<T>;
  constructor(
    val: { type: "value"; value: T } | { type: "promise"; promise: Promise<T> }
  ) {
    switch (val.type) {
      case "value":
        this.state = {
          status: "fulfilled",
          data: val.value,
        };
        break;
      case "promise":
        this.state = {
          status: "pending",
          promise: val.promise.then(
            (data) => {
              this.state = {
                status: "fulfilled",
                data,
              };
              return data;
            },
            (error) => {
              this.state = {
                status: "rejected",
                error,
              };
              throw error;
            }
          ),
        };
    }
  }
  getOrThrow(): T {
    switch (this.state.status) {
      case "pending":
        throw this.state.promise;
      case "fulfilled":
        return this.state.data;
      case "rejected":
        throw this.state.error;
    }
  }
}
