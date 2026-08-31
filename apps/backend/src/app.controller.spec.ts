import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  it("GET /health trả về status ok", () => {
    const controller = new AppController(new AppService());
    expect(controller.getHealth().status).toBe("ok");
  });
});
