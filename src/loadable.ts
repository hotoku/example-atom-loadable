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

export function L<T>(value: T): Loadable<T> {
  return new Loadable(Promise.resolve(value));
}

export function LWA<T, A>(value: T, attr: A): LoadableWithAttr<T, A> {
  return new LoadableWithAttr(Promise.resolve(value), attr);
}

export class Loadable<T> {
  state: LoadableState<T>;
  constructor(promise: Promise<T>) {
    this.state = {
      status: "pending",
      promise: promise.then(
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

export class LoadableWithAttr<T, A> extends Loadable<T> {
  attr: A;
  constructor(promise: Promise<T>, attr: A) {
    super(promise);
    this.attr = attr;
  }
}
