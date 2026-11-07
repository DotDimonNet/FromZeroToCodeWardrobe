import { describe, it, expect, afterEach } from "vitest";
import { store, actions, defaultFilters, api } from "./store";
describe("Wardrobe UI state", () => {
  afterEach(() => {
    store.dispatch(actions.resetFilters());
    store.dispatch(api.util.resetApiState());
  });
  it("combines smart filters without losing prior choices and can clear them", () => {
    store.dispatch(actions.filter({ color: "Blue", season: "Summer" }));
    store.dispatch(actions.filter({ search: "denim", favorites: true }));
    expect(store.getState().ui.filters).toMatchObject({
      color: "Blue",
      season: "Summer",
      search: "denim",
      favorites: true,
    });
    store.dispatch(actions.resetFilters());
    expect(store.getState().ui.filters).toEqual(defaultFilters);
  });
  it("preserves outfit preferences when moving between pages", () => {
    store.dispatch(
      actions.preferences({
        season: "Autumn",
        palette: "Neutral",
        trendId: "essentials",
      }),
    );
    store.dispatch(actions.navigate("community"));
    store.dispatch(actions.navigate("studio"));
    expect(store.getState().ui.preferences).toMatchObject({
      season: "Autumn",
      palette: "Neutral",
      trendId: "essentials",
    });
  });
});
