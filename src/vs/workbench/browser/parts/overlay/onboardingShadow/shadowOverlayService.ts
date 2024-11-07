import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { registerSingleton, InstantiationType } from 'vs/platform/instantiation/common/extensions';
import { Disposable, IDisposable } from 'vs/base/common/lifecycle';
import { CommandsRegistry } from 'vs/platform/commands/common/commands';

export const IShadowOverlayService = createDecorator<IShadowOverlayService>('shadowOverlayService');

export interface IShadowOverlayService extends IDisposable {
    readonly _serviceBrand: undefined;

    highlight(elements: string[]): void;
	restoreStyles(elements: string[]): void;
}


export class ShadowOverlayService extends Disposable implements IShadowOverlayService {
    declare readonly _serviceBrand: undefined;
	private highlightedElements: Map<string, {
        position: string;
        zIndex: string;
        isolation: string;
        pointerEvents: string;
        backgroundColor: string;
        boxShadow: string;
		transition: string,
    }> = new Map();

    constructor(
    ) {
		super();
		this.registerCommands();
	}

	private registerCommands(): void {
		CommandsRegistry.registerCommand('pearai.highlightElements', (accessor, ...args) => {

			const selectors = args[0] as string[];  // array of CSS selectors
			this.highlight(selectors);
		});

		CommandsRegistry.registerCommand('pearai.removeHighlight', (accessor, ...args) => {
			const selectors = args[0] as string[];  // array of CSS selectors
			 // Convert selectors to elements
			 console.dir("in app UNHIGHLIGHT COMMAND, GOT SELECTORS:");
			 console.dir(selectors);
			this.restoreStyles(selectors);
		});
	}

	restoreStyles(selectors: string[]): void {
		selectors.forEach(selector => {
			console.dir("in app RESTORE STYLES, GOT ELEMENT:");
			console.dir(selector);
			const originalStyles = this.highlightedElements.get(selector);
			console.dir(originalStyles);

			const element = document.querySelector(selector) as HTMLElement

			if (originalStyles) {
				element.style.position = originalStyles.position;
				element.style.zIndex = originalStyles.zIndex;
				element.style.isolation = originalStyles.isolation;
				element.style.pointerEvents = originalStyles.pointerEvents;
				element.style.backgroundColor = originalStyles.backgroundColor;
				element.style.boxShadow = originalStyles.boxShadow;

				// Remove this element from the tracked elements
				this.highlightedElements.delete(selector);
			}
		});
	}

	highlight(selectors: string[]): void {
        selectors.forEach(selector => {
            if (selector) {
				const element = document.querySelector(selector) as HTMLElement

				// save original styles
				if (!this.highlightedElements.has(selector)) {
                    this.highlightedElements.set(selector, {
                        position: element.style.position,
                        zIndex: element.style.zIndex,
                        isolation: element.style.isolation,
                        pointerEvents: element.style.pointerEvents,
                        backgroundColor: element.style.backgroundColor,
                        boxShadow: element.style.boxShadow,
                        transition: element.style.transition
                    });

                    console.dir("SAVED ORIGINAL STYLES:");
                    console.dir(this.highlightedElements.get(selector));
                }

				console.dir("in app EXCLUDE FROM DIMMING, GOT ELEMENT:");
				console.dir(element);
				element.style.transition = 'box-shadow 0.3s ease-in-out';

                element.style.position = 'absolute';
                element.style.zIndex = '3000';
				element.style.isolation = 'isolate';
				element.style.pointerEvents = 'auto';
				element.style.backgroundColor = 'transparent';
            	element.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.6)';
            }
        });
    }
}

registerSingleton(IShadowOverlayService, ShadowOverlayService, InstantiationType.Eager,);
