import { useAuthStore } from "../use-auth-store";
import { storeJSON, getJSON, removeItem, STORAGE_KEYS } from "../../utils/storage";

jest.mock("../../utils/storage", () => ({
  storeJSON: jest.fn(),
  getJSON: jest.fn(),
  removeItem: jest.fn(),
  STORAGE_KEYS: {
    AUTH_TOKEN: "AUTH_TOKEN",
    TECHNICIAN: "TECHNICIAN"
  }
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, technician: null, isHydrated: false });
    jest.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.technician).toBeNull();
    expect(state.isHydrated).toBe(false);
  });

  it("should set login state correctly and save to storage", async () => {
    const technician = { id: "123", name: "Test User", email: "test@example.com" } as any;
    const token = "mock-jwt-token";

    await useAuthStore.getState().setAuth(token, technician);

    const state = useAuthStore.getState();
    expect(state.token).toBe(token);
    expect(state.technician).toEqual(technician);

    expect(storeJSON).toHaveBeenCalledWith("AUTH_TOKEN", token);
    expect(storeJSON).toHaveBeenCalledWith("TECHNICIAN", technician);
  });

  it("should handle logout correctly and clear storage", async () => {
    // Set initial logged in state
    useAuthStore.setState({ token: "token", technician: { id: "123" } as any });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.technician).toBeNull();

    expect(removeItem).toHaveBeenCalledWith("AUTH_TOKEN");
    expect(removeItem).toHaveBeenCalledWith("TECHNICIAN");
  });
});
