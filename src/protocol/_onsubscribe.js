
dop.protocol._onsubscribe = function( node, request_id, request, response ) {

    if (response[0] !== undefined) {

        if (response[0] !== 0)
            request.promise.reject( dop.core.getRejectError(response[0], request[2]) );

        else {
            console.log( JSON.stringify(response) );
            var object_path = response[1],
                object_remote_id = object_path[0],
                object_remote = response[2],
                object, object_id;

            if ( node.object_remote[object_remote_id] === undefined ) {
                object = dop.register(object_remote);
                object_id = dop.getObjectId(object);
                node.object_remote[object_remote_id] = object_id;
            }
            else {
                object_id = node.object_remote[object_remote_id];
                object = dop.getObjectRootById(object_id);
            }

            request.promise.resolve( dop.util.get( object, object_path.slice(1) ) );
        }
    }

};