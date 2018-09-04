# Brx

## Abstract

The Brx is a simple data binder to DOM elements of JavaScript.

## Examples

```:HTML
<!-- Target element to be bound -->
<input type="text" class="user_name">

<script>
window.onload = function() {

    // 1. Declare models.
    var models = {
        user: {
            user_name: ""
        }
    };

    // 2. Create Brx object from the models.
    var brx = new Brx({
        "payloads": models
    });

    // 3. Bind to input tag.
    brx.payloads.user._bind("user_name");

    // 4. Put actual data to payloads, then the data will show in input text. 
    brx.payloads = {
        user: {
            user_name: "Motoko"
        }
    };
};
</script>
```

## License

This software is released under the MIT License, see LICENSE.
