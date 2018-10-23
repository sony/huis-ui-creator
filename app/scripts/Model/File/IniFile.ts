/*
    Copyright 2016 Sony Corporation

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

/// <reference path="../../include/interfaces.d.ts" />

module Garage {
    export module Model {
        const TAG: string = "[Garage.Model.IniFile] ";

        export abstract class IniFile {
            constructor() {
            }

            abstract getFilePath(): string;

            /**
             * subclass should define Interface for ini data.
             *
             * @param {string} path ini file path
             * @return {any} parseed ini file data
             */
            protected loadIniFile(file_path: string): any {
                let nodeIni = require("node-ini");
                nodeIni.encoding = 'utf-8';
                try {
                    return nodeIni.parseSync(path.resolve(file_path));
                } catch (e) {
                    console.warn(TAG + "failed to parse ini file: file_path=" + file_path);
                    return;
                }
            }

            public saveAs(file_path: string) {
                let nodeIni = require("ini");

                console.log(TAG + " save file : " + file_path);
                fs.writeFileSync(file_path, nodeIni.stringify(this));
            }

            public save() {
                this.saveAs(this.getFilePath());
            }
        }
    }
}
