#!/bin/bash

rc=0
rm -rf ./coverage

for file in test/*.js
do
  istanbul cover "$file" --report none --print none --include-pid
  irc=$?
  if [[ $irc != 0 ]]
  then
    rc=$irc
  fi
done

if [[ $DEBUG != 'TRUE' ]]
then
  istanbul report --root ./coverage/ lcovonly text-summary
  
  if [[ $DO_NOT_COVER != 'TRUE' ]]
  then
    cat ./coverage/lcov.info | coveralls
  fi

  rm -rf ./coverage
else
  istanbul report --root ./coverage/
fi

exit $rc
