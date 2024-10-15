/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Part } from "vs/workbench/browser/part";
import {
	IWorkbenchLayoutService,
	Parts,
} from "vs/workbench/services/layout/browser/layoutService";
import { IThemeService } from "vs/platform/theme/common/themeService";
import { IStorageService } from "vs/platform/storage/common/storage";
import { $, getActiveWindow } from "vs/base/browser/dom";
import { CancellationTokenSource } from "vs/base/common/cancellation";
import { IInstantiationService } from "vs/platform/instantiation/common/instantiation";

import {
	IWebviewViewService,
	WebviewView,
} from "vs/workbench/contrib/webviewView/browser/webviewViewService";
import { WebviewService } from "vs/workbench/contrib/webview/browser/webviewService";

export class PearOverlayPart extends Part {
	static readonly ID = "workbench.parts.pearoverlay";

	readonly minimumWidth: number = 300;
	readonly maximumWidth: number = 800;
	readonly minimumHeight: number = 200;
	readonly maximumHeight: number = 600;

	private fullScreenOverlay: HTMLElement | undefined;
	private popupAreaOverlay: HTMLElement | undefined;
	private webviewView: WebviewView | undefined;
	private _webviewService: WebviewService | undefined;

	private state: "loading" | "open" | "closed" = "loading";

	constructor(
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IWorkbenchLayoutService layoutService: IWorkbenchLayoutService,
		@IWebviewViewService
		private readonly _webviewViewService: IWebviewViewService,
		@IInstantiationService
		private readonly _instantiationService: IInstantiationService,
	) {
		super(
			PearOverlayPart.ID,
			{ hasTitle: false },
			themeService,
			storageService,
			layoutService,
		);

		this._webviewService =
			this._instantiationService.createInstance(WebviewService);

		this.initialize();
	}

	private async initialize() {
		// 1. create an IOverlayWebview
		const webview = this._webviewService!.createWebviewOverlay({
			title: "PearAI",
			options: {
				enableFindWidget: false,
			},
			contentOptions: {
				allowScripts: true,
				localResourceRoots: [],
			},
			extension: undefined,
		});

		webview.claim(this, getActiveWindow(), undefined);

		// 2. initialize this.webviewView by creating a WebviewView
		this.webviewView = {
			webview,
			onDidChangeVisibility: () => {
				return { dispose: () => {} };
			},
			onDispose: () => {
				return { dispose: () => {} };
			},

			get title(): string | undefined {
				return "PearAI";
			},
			set title(value: string | undefined) {},

			get description(): string | undefined {
				return undefined;
			},
			set description(value: string | undefined) {},

			get badge() {
				return undefined;
			},
			set badge(badge) {},

			dispose: () => {},

			show: (preserveFocus) => {},
		};

		// 3. ask the webviewViewService to connect our webviewView to the webviewViewProvider, PearInventoryPanel
		const source = new CancellationTokenSource(); // todo add to disposables
		await this._webviewViewService.resolve(
			"pearai.overlayWebview",
			this.webviewView!,
			source.token,
		);

		// if both content and webview are ready, end loading state and open
		if (this.popupAreaOverlay && this.webviewView) {
			this.webviewView?.webview.layoutWebviewOverElement(this.popupAreaOverlay);
			this.open();
		} else {
			// hide stuff while we load
			this.webviewView!.webview.container.style.display = "none";
		}
	}

	protected override createContentArea(element: HTMLElement): HTMLElement {
		// create the full screen overlay. this serves as a click target for closing pearai
		this.element = element;
		this.fullScreenOverlay = element; // use the pearOverlayPart root element as the fullScreenOverlay
		this.fullScreenOverlay.style.zIndex = "-10";
		this.fullScreenOverlay.style.position = "absolute";
		this.fullScreenOverlay.style.top = "0";
		this.fullScreenOverlay.style.left = "0";
		this.fullScreenOverlay.style.right = "0";
		this.fullScreenOverlay.style.bottom = "0";
		this.fullScreenOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.2)";

		// create the popup area overlay. this is just a target for webview to layout over
		this.popupAreaOverlay = $("div.pearai-popup-area-overlay");
		this.popupAreaOverlay.style.position = "absolute"; // couldn't get it to work with relative for some reason
		this.popupAreaOverlay.style.margin = "0";
		this.popupAreaOverlay.style.top = "0";
		this.popupAreaOverlay.style.left = "0";
		this.popupAreaOverlay.style.right = "0";
		this.popupAreaOverlay.style.bottom = "0";
		this.element.appendChild(this.popupAreaOverlay);

		// if both content and webview are ready, end loading state and open
		if (this.popupAreaOverlay && this.webviewView) {
			this.webviewView?.webview.layoutWebviewOverElement(this.popupAreaOverlay);
			this.open();
		} else {
			// hide stuff while we load
			this.fullScreenOverlay!.style.display = "none";
		}

		return this.fullScreenOverlay!;
	}

	override layout(
		width: number,
		height: number,
		top: number,
		left: number,
	): void {
		super.layout(width, height, top, left);
		if (this.fullScreenOverlay) {
			this.fullScreenOverlay!.style.width = `${width}px`;
			this.fullScreenOverlay!.style.height = `${height}px`;
		}

		// Calculate 80% of width and height
		const overlayWidth = Math.floor(width * 0.8);
		const overlayHeight = Math.floor(height * 0.8);

		// Calculate position to center the overlay
		const overlayLeft = Math.floor((width - overlayWidth) / 2);
		const overlayTop = Math.floor((height - overlayHeight) / 2);

		if (this.popupAreaOverlay) {
			this.popupAreaOverlay.style.width = `${overlayWidth}px`;
			this.popupAreaOverlay.style.height = `${overlayHeight}px`;
			this.popupAreaOverlay.style.left = `${overlayLeft}px`;
			this.popupAreaOverlay.style.top = `${overlayTop}px`;
		}

		if (this.state === "open") {
			this.webviewView!.webview.layoutWebviewOverElement(
				this.popupAreaOverlay!,
			);
		}
	}

	private open() {
		this.state = "open";
		this.fullScreenOverlay!.style.zIndex = "95";

		const container = this.webviewView!.webview.container;
		container.style.display = "flex";
		container.style.boxSizing = "border-box";
		container.style.boxShadow = "0 0 20px 0 rgba(0, 0, 0, 0.5)";
		container.style.borderRadius = "12px";
		container.style.backgroundColor = "white";
		container.style.zIndex = "1000";

		// Add faster bounce animation
		container.style.animation =
			"pearaiBounceIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
		container.style.transformOrigin = "center";

		// Define keyframes for faster bounce animation and fade out
		const style = document.createElement("style");
		style.textContent = `
			@keyframes pearaiBounceIn {
				0% { transform: scale(0.9); opacity: 0; }
				100% { transform: scale(1); opacity: 1; }
			}
			@keyframes pearaiFadeOut {
				0% { opacity: 1; }
				100% { opacity: 0; }
			}
		`;
		document.head.appendChild(style);

		this.fullScreenOverlay?.addEventListener("click", () => {
			this.close();
		});

		this.webviewView!.webview.layoutWebviewOverElement(this.popupAreaOverlay!);
		this.focus();
	}

	private close() {
		this.state = "closed";
		const container = this.webviewView!.webview.container;

		// Apply fade-out animation
		container.style.animation = "pearaiFadeOut 0.2s ease-out";

		// Hide elements after animation completes
		setTimeout(() => {
			this.fullScreenOverlay!.style.zIndex = "-10";
			container.style.display = "none";
		}, 20); // 20ms matches the animation duration
	}

	private toggleOpenClose() {
		this.state === "open" ? this.close() : this.open();
	}

	focus(): void {
		if (this.webviewView) {
			this.webviewView.webview.focus();
		}
	}

	show(): void {
		if (this.state === "loading") {
			console.warn("Can't open PearAI while loading");
			return;
		}

		this.open();
	}

	hide(): void {
		if (this.state === "loading") {
			console.warn("Can't close PearAI while loading");
			return;
		}
		this.close();
	}

	toggle(): void {
		if (this.state === "loading") {
			console.warn("Can't toggle PearAI while loading");
			return;
		}
		this.toggleOpenClose();
	}

	toJSON(): object {
		return {
			type: Parts.PEAROVERLAY_PART,
		};
	}
}