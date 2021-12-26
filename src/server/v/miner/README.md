# V SkrrrtCoin miner

This is a basic miner for 
SkrrrtCoin implemented in [vlang](https://github.com/vlang/v). 

V does not have a fully optimized memory management yet. That is why I highly recommend using `-gc boehm` as compiler flag. This is a garbage collector based on the principle developed by Boehm, Demers and Weiser. For the latter to work, you need to install [this](https://github.com/ivmai/bdwgc) package. On Linux machines simply install `libgc-dev`.

Have fun!
