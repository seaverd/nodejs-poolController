/*  nodejs-poolController.  An application to control pool equipment.
Copyright (C) 2016, 2017.  Russell Goldin, tagyoureit.  russ.goldin@gmail.com

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import { sys, Chlorinator } from "../../../Equipment";
import { Inbound } from "../Messages";
import { state } from "../../../State";
import { logger } from "../../../../logger/Logger"
export class ChlorinatorMessage {
    public static process(msg: Inbound): void {
        var chlorId;
        var chlor: Chlorinator;
        switch (msg.extractPayloadByte(1)) {
            case 0:
                chlorId = 1;
                for (let i = 0; i < 4 && i + 30 < msg.payload.length; i++) {
                    let isActive = msg.extractPayloadByte(i + 22) === 1;
                    if (i >= sys.equipment.maxChlorinators || !isActive) {
                        sys.chlorinators.removeItemById(chlorId);
                        state.chlorinators.removeItemById(chlorId);
                    }
                    else {
                        chlor = sys.chlorinators.getItemById(chlorId, isActive);
                        chlor.body = msg.extractPayloadByte(i + 2);
                        chlor.type = msg.extractPayloadByte(i + 6);
                        chlor.poolSetpoint = msg.extractPayloadByte(i + 10);
                        chlor.spaSetpoint = msg.extractPayloadByte(i + 14);
                        chlor.superChlor = msg.extractPayloadByte(i + 18) === 1;
                        chlor.isActive = msg.extractPayloadByte(i + 22) === 1;
                        chlor.superChlorHours = msg.extractPayloadByte(i + 26);
                        chlor.address = 80 + i;
                        let schlor = state.chlorinators.getItemById(chlor.id, isActive);
                        schlor.body = chlor.body;
                        schlor.poolSetpoint = chlor.poolSetpoint;
                        schlor.spaSetpoint = chlor.spaSetpoint;
                        schlor.type = chlor.type;
                        schlor.superChlorHours = chlor.superChlorHours;
                        state.emitEquipmentChanges();
                    }
                    chlorId++;
                }
                break;
            default:
                logger.debug(`Unprocessed Config Message ${msg.toPacket()}`)
                break;
        }
    }
}