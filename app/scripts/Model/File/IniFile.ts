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

        export class IniFile {
            private file_path_ : string;

            constructor() {
                this.file_path_ = "";
            }

            /**
             * subclass should define Interface for ini data.
             *
             * @param {string} path ini file path
             * @return {any} parseed ini file data
             */
            protected loadIniFile(path: string): any {
                this.file_path_ = path;
                let nodeIni = require("node-ini");
                try {
                    return nodeIni.parseSync(this.file_path_);
                } catch (e) {
                    console.warn(TAG + "failed to parse ini file: file_path=" + this.file_path_);
                    return;
                }
            }

            get section(): string {
                return "section";
            }

            public saveAs(file_path: string) {
                let nodeIni = require("ini");

                fs.writeFileSync(file_path, nodeIni.stringify(this, {section: this.section}));
            }

            public save() {
                this.saveAs(this.file_path_);
            }
        }
    }
}