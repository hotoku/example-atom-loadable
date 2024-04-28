# React Suspense の習作

Reactで「ロード中」を実現する方法の`Suspense`を使った例を実装してみた例。

Suspenseの基本動作や、それと組み合わせて利用している`Loadable`というパターンの詳細は、uhyo氏の[こちらの本][uhyo]を参照した。

## 雑感

- `Suspense`は`Promise`を受け取る、`Loadable`は`Promise`を投げる、というのが基本の役割。
  - したがって、この`Loadable`が投げた`Promise`は、この`Suspense`が受け取る、ということを意識の片隅に置いておくとよい。
- `Loadable`によって、描画しようとしているオブジェクト(=コンポーネントに渡された`props`)がどういう状態にあるのか(pending, fulfilled, error)が明示的に列挙され、型チェックで考慮もれを防げるので安心感がある。
  - しかし、`Loadable`がネストするようなケースでは、考慮すべき状態の分岐がメチャ増えるので、適切に設計することが必要。
  - 単純に考えると、2段階にnestするだけで3×3の9パターンが出てくるので、あまりnestさせることは現実的ではなさそう。

<!-- link -->
[uhyo]: https://zenn.dev/uhyo/books/react-concurrent-handson?utm_source=pocket_saves
