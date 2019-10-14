import * as React from "react";
import {CoreHelper} from "../../core/utils/CoreHelper";
import {LocaleKey, LocaleParams} from "../locales";

import {Icon, Spin} from "antd";

export type ElementSize = "xs" | "sm" | "md" | "lg" | "xl";

export abstract class WebHelper {
  static Router: any = CoreHelper.isStorybook ? require("react-router-dom").MemoryRouter : require("react-router-dom").BrowserRouter;

  static get LoadingSpin(): React.ReactNode {
    const icon = <Icon type="loading" className="ol-spin" />;

    return (
      <div className="ol-spin-container">
        <Spin indicator={icon} delay={500} />
      </div>
    );
  }

  static formatMessage<TLocaleKey extends LocaleKey>(messageId: TLocaleKey, variables: LocaleParams[TLocaleKey] | undefined = undefined, defaultMessage: string | undefined = undefined, parseLineBreaks = false): string {
    return CoreHelper.formatMessage(messageId as any, variables, defaultMessage, parseLineBreaks);
  }

  static parseMarkdown(text: string): string {
    const rules = [
      {regex: /(\*\*|__)(.*?)\1/g, replacement: `<strong>$2</strong>`}, // bold
      {regex: /(\*|__)(.*?)\1/g, replacement: `<i>$2</i>`}, // italic
      {regex: /(\+\+|__)(.*?)\1/g, replacement: `<u>$2</u>`}, // underline
    ];

    let result = `<span>${text}</span>`;

    rules.forEach(rule => {
      result = result.replace(rule.regex, rule.replacement);
    });

    return result;
  }

  static parseLocationSearch(search: string): any {
    const result: any = {};

    if (search.length === 0) return result;

    const args = search.substring(1).split("&");
    let i, arg, kvp, key, value;

    for (i = 0; i < args.length; i++) {
      arg = args[i];

      if (-1 === arg.indexOf("=")) {
        result[decodeURIComponent(arg).trim()] = true;
      } else {
        kvp = arg.split("=");

        key = decodeURIComponent(kvp[0]).trim();
        value = decodeURIComponent(kvp[1]).trim();

        result[key] = value;
      }
    }

    return result;
  }

  static openLinkInNewTab(url: string) {
    const link: any = document.createElement("a");
    link.href = url;
    link.target = "_blank";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
  }

  static loadScriptAsync(src: string, callback?: (script: any) => void) {
    const script: any = document.createElement("script");
    let loaded = false;

    script.setAttribute("src", src);
    if (callback) {
      script.onreadystatechange = script.onload = () => {
        if (!loaded) {
          callback(script);
        }
        loaded = true;
      };
    }
    document.getElementsByTagName("head")[0].appendChild(script);
  }

  static scrollElementTo(element: any, to: number, duration: number) {
    const start = element.scrollTop,
      change = to - start,
      increment = 20;
    let currentTime = 0;

    const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t + b;
      t--;
      return (-c / 2) * (t * (t - 2) - 1) + b;
    };

    const animateScroll = () => {
      currentTime += increment;

      const value = easeInOutQuad(currentTime, start, change, duration);
      element.scrollTop = value;

      if (currentTime < duration) setTimeout(animateScroll, increment);
    };

    animateScroll();
  }
}
