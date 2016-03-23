/// <reference path="../include/interfaces.d.ts" />

module Garage {
	export module Util {
		export interface IDataOptions {
			all?: boolean; //! true を指定した場合、すべての要素の deta 属性に値を入れる。それ以外の場合は、先頭の要素の data 属性に値を入れる。
		}

		export class JQueryUtils {

			/**
			 * jQuery オブジェクトで選択された DOM の data 属性を取得する。
			 * 
			 * @param $elem {JQuery} DOM を選択した jQuery
			 * @param key {string} data 属性のキー。キーは　data を除いて lowerCammelCase で書く ([例] data-key-value -> keyValue)
			 * @return {any} 取得した値
			 */
			static data($elem: JQuery, key: string, options?: IDataOptions): any;

			/**
			 * jQuery オブジェクトで選択された DOM の data 属性に値を設定する。
			 * 
			 * @param $elem {JQuery} DOM を選択した jQuery
			 * @param key {string} data 属性のキー。キーは　data を除いて lowerCammelCase で書く ([例] data-key-value -> keyValue)
			 * @param value {string | number} 設定したい値
			 * @pram options {IDataOptions} オプション
			 * @return {any} 取得した値
			 */
			static data($elem: JQuery, key: string, value: string | number, options?: IDataOptions): void;

			static data($elem: JQuery, key: string, param1?: any | string | number, param2?: IDataOptions): void | any {
				if (!$elem || $elem.length < 1) {
					return null;
				}

				if (_.isString(param1) || _.isNumber(param1)) {
					if (param2 && param2.all) {
						$elem.each((index, elem) => {
							(<HTMLElement>elem).dataset[key] = param1;
						});
					} else {
						$elem.get(0).dataset[key] = param1;
					}
				} else {
					return $elem.get(0).dataset[key];
				}
			}
		}
	}
} 