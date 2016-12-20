/// <reference path='../../_all.ts' />

module scrumdo {
    export class SyncronizedModel {
        // A quick helper class for wiring up the signals and sending messages
        // to do data syncronization.
        
        constructor(public scope, public syncKey, public realtimeService, public service) {
            this.scope.$on("DATA:SYNC:" + syncKey, this.onSync);
            this.scope.$on("DATA:ADD:" + syncKey, this.onAdd);
            this.scope.$on("DATA:DEL:" + syncKey, this.onDel);
            this.scope.$on("DATA:UPDATE:" + syncKey, this.onUpdate);
        }

        signalModelCreated(model, relatedLists) {
            var i, len, listId, results;
            results = [];
            for (i = 0, len = relatedLists.length; i < len; i++) {
                listId = relatedLists[i];
                results.push(this.realtimeService.sendMessage("DATA:ADD:" + this.syncKey, {
                    modelId: model.id,
                    listId: listId
                }));
            }
            return results;
        }

        signalModelDeleted(modelId) {
            return this.realtimeService.sendMessage("DATA:DEL:" + this.syncKey, {
                modelId: modelId
            });
        }

        signalModelEdited(model) {
            return this.realtimeService.sendMessage("DATA:SYNC:" + this.syncKey, {
                modelId: model.id
            });
        }

        signalModelUpdate(model, properties) {
            return this.realtimeService.sendMessage("DATA:UPDATE:" + this.syncKey, {
                modelId: model.id,
                properties: properties
            });
        }

        onSync = (event, message) => {
            return this.service.reload(message.payload.modelId);
        }

        onAdd = (event, message) => {
            return this.service.onAdded(message.payload.modelId, message.payload.listId);
        }

        onDel = (event, message) => {
            return this.service.onRemoved(message.payload.modelId);
        }

        onUpdate = (event, message) => {
            return this.service.onUpdate(message.payload.modelId, message.payload.properties);
        }
    }
}