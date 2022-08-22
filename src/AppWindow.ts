import {OWWindow} from "@overwolf/overwolf-api-ts";

export class AppWindow {
  protected currWindow: OWWindow;
  protected mainWindow: OWWindow;
  protected maximized: boolean = false;

  constructor(windowName: string) {
    this.currWindow = new OWWindow(windowName);

    const closeButton = document.getElementById('closeButton');

    const header = document.getElementById('header');

    this.setDrag(header);

    /*closeButton.addEventListener('click', () => {
      this.mainWindow.close();
    });*/
  }

  public async getWindowState() {
    return await this.currWindow.getWindowState();
  }

  private setDrag(elem: HTMLElement) {
    this.currWindow.dragMove(elem);
  }
}
