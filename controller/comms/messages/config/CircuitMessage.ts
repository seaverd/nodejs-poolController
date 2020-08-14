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
import { Inbound } from "../Messages";
import { sys, Body, Circuit, ICircuit } from "../../../Equipment";
import { state } from "../../../State";
import { logger } from "../../../../logger/Logger";

export class CircuitMessage {
    public static process(msg: Inbound): void {
        switch (msg.action) {
            case 11: // IntelliTouch Circuits
                CircuitMessage.processCircuitAttributes(msg);
                break;
            case 30: // IntelliCenter
                switch (msg.extractPayloadByte(1)) {
                    case 0: // Circuit Type
                        CircuitMessage.processCircuitTypes(msg);
                        break;
                    case 1: // Freeze
                        CircuitMessage.processFreezeProtect(msg);
                        break;
                    case 2: // Show in features
                        CircuitMessage.processShowInFeatures(msg);
                        break;
                    case 3: // Circuit Names
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                    case 9:
                    case 10:
                    case 11:
                    case 12:
                    case 13:
                    case 14:
                    case 15:
                    case 16:
                    case 17:
                    case 18:
                    case 19:
                    case 20:
                    case 21:
                    case 22:
                    case 23:
                    case 24:
                        CircuitMessage.processCircuitNames(msg);
                        break;
                    case 25: // Not sure what this is.
                        break;
                    case 26:
                        CircuitMessage.processLightingTheme(msg);
                        break;
                    case 27:
                        CircuitMessage.processEggTimerHours(msg);
                        break;
                    case 28:
                        CircuitMessage.processEggTimerMinutes(msg);
                        break;
                    case 29:
                        CircuitMessage.processShowInCircuits(msg);
                        break;
                    default:
                        logger.debug(`Unprocessed Config Message ${msg.toPacket()}`)
                        break;
                }
                break;
            case 39: // IntelliTouch Light Groups
            case 167:
                CircuitMessage.processIntelliBrite(msg);
                break;
            default:
                logger.debug(`Unprocessed Message ${msg.toPacket()}`)
                break;
        }
    }
    private static processIntelliBrite(msg: Inbound) {
        //                        1        2             3            4           5           6           7           8
        //                        0  1 2 3 4  5  6  7   8   9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31
        // [165,16,16,34,167,32],[9,32,0,0,7,32, 0, 0, 18, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 254]
        // [165,16,15,16, 39,32],[8, 0,0,0,9, 0, 0, 0,  0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[1,44]

        // [255,255,255,255,255,255,255,0,255,165,1,15,16,39,25,2,255,129,45,127,215,235,250,203,251,249,128]

        /* IntelliTouch does NOT notify the controllers when something is deleted.
            Thus, we must keep track of all current items and delete/re-init them every time.
            The IntelliBrite Collection does that and we will wipe clean all IntelliBrite/Circuit relationships and re-establish each time the packet(s) are resent.  */
        let byte: number; // which byte are we starting with?
        msg.datalen === 25 ? byte = 1 : byte = 0;
        // sys.intellibrite.isActive = true;
        let lg = sys.lightGroups.getItemById(sys.board.equipmentIds.circuitGroups.start, true);
        let sgrp = state.lightGroups.getItemById(sys.board.equipmentIds.circuitGroups.start, true);
        lg.isActive = sgrp.isActive = true;
        lg.name = sgrp.name = 'Intellibrite';
        lg.type = sgrp.type = 3;
        sgrp.action = 0;
        if ((msg.datalen === 25 && msg.extractPayloadByte(0) === 0) || msg.datalen === 32) {
            // if this is the first (or only) packet, reset all IB to active=false and re-verify they are still there with incoming packets
/*             for (let i = 0; i < sys.intellibrite.circuits.length; i++) {
                let ibCircuit = sys.intellibrite.circuits.getItemByIndex(i);
                // only evaluate intellibrites here; skip others
                // if (sys.circuits.getItemById(ib.circuit).type !== 16) continue;
                ibCircuit.isActive = false;
            } */
            for (let i = 0; i < lg.circuits.length; i++) {
                let lgCircuit = lg.circuits.getItemByIndex(i);
                // only evaluate intellibrites here; skip others
                // if (sys.circuits.getItemById(ib.circuit).type !== 16) continue;
                lgCircuit.isActive = false;
            }
        }
        for (byte; byte <= msg.datalen; byte = byte + 4) {
            let circuitId = msg.extractPayloadByte(byte);
            if (circuitId > 0) {
                let pair = msg.extractPayloadByte(byte + 1);
                let _isActive = circuitId > 0 && pair > 0;
                if (_isActive) {
/*                     const ibCircuit = sys.intellibrite.circuits.getItemByCircuitId(circuitId, _isActive);
                    ibCircuit.isActive = _isActive;
                    ibCircuit.circuit = circuitId;
                    ibCircuit.position = (pair >> 4) + 1;
                    ibCircuit.color = pair & 15;
                    ibCircuit.swimDelay = msg.extractPayloadByte(byte + 2) >> 1; */
                    const lgCircuit = lg.circuits.getItemByCircuitId(circuitId, _isActive);
                    lgCircuit.isActive = _isActive;
                    lgCircuit.circuit = circuitId;
                    lgCircuit.position = (pair >> 4) + 1;
                    lgCircuit.color = pair & 15;
                    lgCircuit.swimDelay = msg.extractPayloadByte(byte + 2) >> 1;
                }
            }
        }
        // go through and clean up what is not active only if this is the last (or only) packet
        if ((msg.datalen === 25 && msg.extractPayloadByte(0) === 1) || msg.datalen === 32)
/*             for (let idx = 0; idx < sys.intellibrite.circuits.length; idx++) {
                const ibCircuit = sys.intellibrite.circuits.getItemByIndex(idx);
                if (ibCircuit.isActive === true) continue;
                sys.intellibrite.circuits.removeItemById(ibCircuit.circuit);
            } */
            for (let idx = 0; idx < lg.circuits.length; idx++) {
                const lgCircuit = lg.circuits.getItemByIndex(idx);
                if (lgCircuit.isActive === true) continue;
                lg.circuits.removeItemById(lgCircuit.circuit);
            }
        // Now that we are done.  Lets sort the array by position.
        //  sys.intellibrite.circuits.sortByPosition();
        if (lg.circuits.length === 0){
            lg.isActive = false;
            sys.lightGroups.removeItemById(sys.board.equipmentIds.circuitGroups.start);
            state.lightGroups.removeItemById(sys.board.equipmentIds.circuitGroups.start);
        }
    }
    private static processCircuitTypes(msg: Inbound) {
        let circuitId = sys.board.equipmentIds.circuits.start;
        // With single body systems we have a funny scenario where circuit 1 is just ignored.
        let maxCircuitId = sys.board.equipmentIds.circuits.end;
        for (let i = circuitId + 1; i < msg.payload.length && circuitId <= maxCircuitId; i++) {
            let circuit: Circuit = sys.circuits.getItemById(circuitId++, true);

            // For some odd reason the circuit type for circuit 6 does not equal pool while circuit 1 does equal spa.
            circuit.type = circuitId - 1 !== 6 ? msg.extractPayloadByte(i) : 12;
            circuit.isActive = true;
           /*  switch (circuit.type) {
                case 5:
                case 6:
                case 8:
                case 10:
                    sys.intellibrite.circuits.getItemByCircuitId(circuit.id, true);
                    // RG - to RKS shouldn't these be as below.  Not sure why intellibrite is being set here.
                    // sys.lightGroups.getItemById(1, true).circuits.getItemByCircuitId(circuit.id, true);
                    break;
                    default:
                        sys.intellibrite.circuits.removeItemByCircuitId(circuit.id);
                        // sys.lightGroups.getItemById(1, true).circuits.removeItemByCircuitId(circuit.id);
                    break;
            }  */
        } 
        // sys.intellibrite.circuits.sortByPosition();
    }
    private static processFreezeProtect(msg: Inbound) {
        let circuitId = sys.board.equipmentIds.circuits.start;
        // With single body systems we have a funny scenario where circuit 1 is just ignored.
        let maxCircuitId = sys.board.equipmentIds.circuits.end;
        for (let i = circuitId + 1; i < msg.payload.length && circuitId <= maxCircuitId; i++) {
            let circuit: Circuit = sys.circuits.getItemById(circuitId++, true);
            circuit.freeze = msg.extractPayloadByte(i) > 0;
        }
    }
    private static processShowInFeatures(msg: Inbound) {
        let circuitId = sys.board.equipmentIds.circuits.start;
        // With single body systems we have a funny scenario where circuit 1 is just ignored.
        let maxCircuitId = sys.board.equipmentIds.circuits.end;
        for (let i = circuitId + 1; i < msg.payload.length && circuitId <= maxCircuitId; i++) {
            let circuit: Circuit = sys.circuits.getItemById(circuitId++, true);
            circuit.showInFeatures = msg.extractPayloadByte(i) > 0;
        }
    }
    private static processCircuitNames(msg: Inbound) {
        let circuitId = ((msg.extractPayloadByte(1) - 3) * 2) + 1;  // In single body systems the very first circuit name is spa.  We used to start at the id start
                                                                    // but it should always start at the 1 and the start id in single bodies is 2 and isInRange
                                                                    // will filter our the first one.
        if (sys.board.equipmentIds.circuits.isInRange(circuitId)) sys.circuits.getItemById(circuitId++, true).name = msg.extractPayloadString(2, 16);
        if (sys.board.equipmentIds.circuits.isInRange(circuitId)) sys.circuits.getItemById(circuitId++, true).name = msg.extractPayloadString(18, 16);
    }
    private static processLightingTheme(msg: Inbound) {
        let circuitId = sys.board.equipmentIds.circuits.start;
        // With single body systems circuit 1 is ignored.
        let maxCircuitId = sys.board.equipmentIds.circuits.end;
        for (let i = circuitId + 1; i < msg.payload.length && circuitId <= maxCircuitId; i++) {
            let circuit: Circuit = sys.circuits.getItemById(circuitId++, true);
            if (circuit.type === 9) // We are a dimmer.
                circuit.level = msg.extractPayloadByte(i);
            else
                circuit.lightingTheme = msg.extractPayloadByte(i);
        }
    }
    private static processEggTimerHours(msg: Inbound) {
        let circuitId = sys.board.equipmentIds.circuits.start;
        // With single body systems we have a funny scenario where circuit 1 is just ignored.
        let maxCircuitId = sys.board.equipmentIds.circuits.end;
        for (let i = circuitId + 1; i < msg.payload.length && circuitId <= maxCircuitId; i++) {
            let circuit: Circuit = sys.circuits.getItemById(circuitId++, true);
            circuit.eggTimer = msg.extractPayloadByte(i) * 60 + (circuit.eggTimer || 0) % 60;
        }
    }
    private static processEggTimerMinutes(msg: Inbound) {
        let circuitId = sys.board.equipmentIds.circuits.start;
        // With single body systems we have a funny scenario where circuit 1 is just ignored.
        let maxCircuitId = sys.board.equipmentIds.circuits.end;
        for (let i = circuitId + 1; i < msg.payload.length && circuitId <= maxCircuitId; i++) {
            const circuit: Circuit = sys.circuits.getItemById(circuitId++, true);
            circuit.eggTimer = Math.floor(circuit.eggTimer / 60) * 60 + msg.extractPayloadByte(i);
        }
    }
    private static processShowInCircuits(msg: Inbound) {
        let circuitId = sys.board.equipmentIds.circuits.start;
        // With single body systems we have a funny scenario where circuit 1 is just ignored.
        let maxCircuitId = sys.board.equipmentIds.circuits.end;
        for (let i = circuitId + 1; i < msg.payload.length && circuitId <= maxCircuitId; i++) {
            let circuit: Circuit = sys.circuits.getItemById(circuitId++, true);
            circuit.showInCircuits = msg.extractPayloadByte(i) > 0;
        }
    }

    // Intellitouch
    private static processCircuitAttributes(msg: Inbound) {
        // Sample packet
        // [255, 0, 255], [165, 33, 15, 16, 11, 5], [1, 1, 72, 0, 0], [1, 63]
        const id = msg.extractPayloadByte(0);
        const functionId = msg.extractPayloadByte(1);
        const nameId = msg.extractPayloadByte(2);
        let _isActive = functionId !== sys.board.valueMaps.circuitFunctions.getValue('notused') && nameId !== 0;
        if (!sys.board.equipmentIds.invalidIds.isValidId(id)) { _isActive = false; }
        if (_isActive) {
            const type = functionId & 63;
            let circuit: ICircuit = sys.circuits.getInterfaceById(id, _isActive);
            circuit.name = sys.board.circuits.getNameById(nameId);
            circuit.nameId = nameId;
            circuit.type = type;
            circuit.isActive = _isActive;
            circuit.freeze = (functionId & 64) === 64;
            circuit.showInFeatures = typeof circuit.showInFeatures === 'undefined' ? true : circuit.showInFeatures;
            circuit.isActive = _isActive;
            if (typeof circuit.eggTimer === 'undefined') circuit.eggTimer = 0;
            if ([9, 10, 16, 17].includes(circuit.type)) {
/*                 const ib = sys.intellibrite.circuits.getItemByCircuitId(id, true);
                sys.intellibrite.isActive = true;
                ib.isActive = true; */
                const lg = sys.lightGroups.getItemById(sys.board.equipmentIds.circuitGroups.start, true);
                const sgrp = state.lightGroups.getItemById(sys.board.equipmentIds.circuitGroups.start, true);
                sgrp.action = 0;
                lg.circuits.getItemByCircuitId(id, true).isActive = true;
                lg.isActive = sgrp.isActive = true;
            }
            else {
                // sys.intellibrite.circuits.removeItemByCircuitId(id);
                sys.lightGroups.getItemById(sys.board.equipmentIds.circuitGroups.start).circuits.removeItemByCircuitId(id);
            }
            if (sys.board.equipmentIds.circuits.isInRange(id)) {
                // Circuits will be the only type that are referenced here.
                if (circuit.type === 0) return; // do not process if type doesn't exist
                let body: Body;
                switch (msg.extractPayloadByte(0)) {
                    case 6: // pool
                        body = sys.bodies.getItemById(1, sys.equipment.maxBodies > 0);
                        body.name = "Pool";
                        body.type = 1;
                        circuit.type === 2 ? body.isActive = true : body.isActive = false;
                        // sys.board.virtualChlorinatorController.start();
                        break;
                    case 1: // spa
                        body = sys.bodies.getItemById(2, sys.equipment.maxBodies > 1);
                        body.name = "Spa";
                        body.type = 0;
                        // process bodies - there might be a better place to do this but without other comparison packets from pools with expansion packs it is hard to determine
                        // also, if we get this far spa should always be active.  not sure if would ever not be active if we are here.
                        circuit.type === 1 ? body.isActive = true : body.isActive = false;
                        break;
                }
            }
            else {
                // feature specific logic
                // RSG - 7/8/2020 i5+3s did not have this function byte set;
                // now setting it from circuitGroup
                // circuit.macro = (functionId & 128) === 128;
            }
        }
        else {
/*             if (sys.intellibrite.circuits.length === 0) {
                sys.intellibrite.isActive = false;
            } */
            if (sys.lightGroups.getItemById(sys.board.equipmentIds.circuitGroups.start).circuits.length === 0) {
                sys.lightGroups.getItemById(sys.board.equipmentIds.circuitGroups.start).isActive = false;
                sys.lightGroups.removeItemById(sys.board.equipmentIds.circuitGroups.start);
                state.lightGroups.removeItemById(sys.board.equipmentIds.circuitGroups.start);
            }
            sys.features.removeItemById(id);
            state.features.removeItemById(id);
            sys.circuits.removeItemById(id);
            state.circuits.removeItemById(id);
            sys.circuitGroups.removeItemById(id);
        }
    }
}