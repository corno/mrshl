// import { CollectionBuilder, ComponentBuilder, EntryBuilder, NodeBuilder, ValueBuilder } from "./api"

// /* eslint
//     max-classes-per-file: "off",
// */

// export class DummyCollectionBuilder implements CollectionBuilder {
//     public createEntry() {
//         return new DummyEntryBuilder()
//     }
// }

// export class DummyComponentBuilder implements ComponentBuilder {
//     public readonly node = new DummyNodeBuilder()
// }

// export class DummyEntryBuilder implements EntryBuilder {
//     public readonly node = new DummyNodeBuilder()
//     public insert() {
//         //
//     }
// }

// export class DummyNodeBuilder implements NodeBuilder {
//     public setCollection(_name: string) {
//         return new DummyCollectionBuilder()
//     }
//     public setComponent(_name: string) {
//         return new DummyComponentBuilder()
//     }
//     public setStateGroup(_name: string, _stateName: string) {
//         return new DummyStateBuilder()
//     }
//     public setSimpleValue(_name: string, _value: string) {
//         return new DummyValueBuilder()
//     }
// }

// export class DummyValueBuilder implements ValueBuilder {
//     getSuggestions() {
//         return []
//     }
// }

// export class DummyStateBuilder {
//     public readonly node = new DummyNodeBuilder()
// }