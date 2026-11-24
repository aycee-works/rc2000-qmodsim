importScripts('model.js');
self.onmessage = ({data}) => {
  const {id, frequency, containment} = data;
  self.postMessage({id, result: IntakeModel.annualRisk(frequency, containment, 61)});
};

