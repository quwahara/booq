# Brx

## Abstract

The Brx is a simple data binder to DOM elements of JavaScript.

## Examples

```HTML
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
        "io": models
    });

    // 3. Bind to input tag.
    brx.io.user._bind("user_name");

    // 4. Put actual data to io, then the data will show in input text. 
    brx.io = {
        user: {
            user_name: "Motoko"
        }
    };
};
</script>
```

## Opts

```JavaScript
{
    // (Optional) `rootElem` is a receiver to call querySelectorAll method.
    rootElem: null, 
    // (Optional) `query` is a parameter to call querySelectorAll method.
    // It will be "." + prop value if it is omitted.
    // It means an element will be selected that has same name in its class attribute.
    query: null,
}
```


## License

This software is released under the MIT License, see LICENSE.
