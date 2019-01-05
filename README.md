# Booq

## Abstract

The Booq is a simple data binder to DOM elements.

## Examples

```HTML

<!-- Reference to booq.js -->
<script src="path/to/booq/booq.js"></script>

<!-- Target element to be bound -->
<input type="text" name="user_name">

<script>
window.onload = function() {

    // 1. Declare structs.
    // The structs are requirements to use Booq.
    // Booq produces its properties by structs.
    // The properties are to be bound data to elements.
    var structs = {
        user: {
            user_name: ""
        }
    };

    // 2. Create Booq object from the structs.
    var booq = new Booq(structs);

    // 3. Bind to input tag.
    booq.user.user_name.withValue();

    // 4. Put an actual data to data property then the data will show in input text. 
    booq.data = {
        user: {
            user_name: "Motoko"
        }
    };
};
</script>
```

## License

This software is released under the MIT License, see LICENSE.
