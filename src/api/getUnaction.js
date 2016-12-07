
dop.getUnaction = function(mutations) {

    var unaction = {},
        index = mutations.length-1,
        mutation;

    for (;index>-1; --index)
        dop.core.injectMutationInAction(unaction, mutations[index], true);

    return unaction;
};